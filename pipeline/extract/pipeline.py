from typing import Optional
import json
import os
import threading
from typing import TypedDict

import httpx
from dotenv import load_dotenv
from langgraph.graph import END, START, StateGraph

from db.client import call_embed, create_workflow_if_missing, insert_rule
from extract.models import ExtractedRule
from extract.prompts import EXTRACTION_PROMPT

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")


class PipelineState(TypedDict):
    chunks: list[str]
    current_chunk_index: int
    extracted_rules: list[ExtractedRule]
    workflow_name: str
    department: str
    owner_name: str
    owner_email: str
    source: str
    source_url: Optional[str]
    errors: list[str]


def _similarity(a: str, b: str) -> float:
    a, b = a.lower(), b.lower()
    if not a or not b:
        return 0.0
    shorter, longer = (a, b) if len(a) <= len(b) else (b, a)
    matches = sum(1 for ch in shorter if ch in longer)
    return matches / len(longer)


def extract_from_chunk(state: PipelineState) -> PipelineState:
    idx = state["current_chunk_index"]
    chunk = state["chunks"][idx]
    errors = list(state["errors"])
    rules = list(state["extracted_rules"])

    prompt = EXTRACTION_PROMPT.format(
        workflow_name=state["workflow_name"],
        department=state["department"],
        chunk=chunk,
    )

    try:
        api_key = os.getenv("OLLAMA_API_KEY", "")
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        is_remote = bool(api_key) and "localhost" not in OLLAMA_BASE_URL

        base_url = OLLAMA_BASE_URL.rstrip("/")
        if not base_url.endswith("/v1"):
            base_url = base_url + "/v1"

        payload = {
            "model": OLLAMA_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "max_tokens": 2000,
        }

        if is_remote:
            payload["chat_template_kwargs"] = {"enable_thinking": False}

        resp = httpx.post(
            f"{base_url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60.0,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"].strip()

        # Strip markdown code fences if present
        if content.startswith("```"):
            lines = content.splitlines()
            content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

        parsed = json.loads(content)
        if isinstance(parsed, list):
            for item in parsed:
                try:
                    rules.append(ExtractedRule(**item))
                except Exception as e:
                    errors.append(f"Chunk {idx} rule parse error: {e}")
    except json.JSONDecodeError as e:
        errors.append(f"Chunk {idx} JSON decode error: {e}")
    except Exception as e:
        errors.append(f"Chunk {idx} LLM error: {e}")

    return {
        **state,
        "extracted_rules": rules,
        "current_chunk_index": idx + 1,
        "errors": errors,
    }


def deduplicate(state: PipelineState) -> PipelineState:
    rules = state["extracted_rules"]
    deduped: list[ExtractedRule] = []
    for rule in rules:
        is_dup = any(_similarity(rule.summary, existing.summary) > 0.8 for existing in deduped)
        if not is_dup:
            deduped.append(rule)
    return {**state, "extracted_rules": deduped}


def write_to_db(state: PipelineState) -> PipelineState:
    errors = list(state["errors"])
    workflow_id = create_workflow_if_missing(state["workflow_name"], state["department"], state.get("owner_email") or "pipeline")

    for rule in state["extracted_rules"]:
        try:
            rule_id = insert_rule(
                rule,
                workflow_id,
                state["owner_name"],
                state["owner_email"],
                state["source"],
                state["source_url"],
            )
            embed_text = f"{rule.summary}. {rule.detail}"
            threading.Thread(target=call_embed, args=(rule_id, embed_text), daemon=True).start()
        except Exception as e:
            errors.append(f"DB write error for rule '{rule.summary[:40]}': {e}")

    return {**state, "errors": errors}


def _should_continue(state: PipelineState) -> str:
    if state["current_chunk_index"] < len(state["chunks"]):
        return "extract_from_chunk"
    return "deduplicate"


def build_pipeline() -> StateGraph:
    graph = StateGraph(PipelineState)
    graph.add_node("extract_from_chunk", extract_from_chunk)
    graph.add_node("deduplicate", deduplicate)
    graph.add_node("write_to_db", write_to_db)

    graph.add_edge(START, "extract_from_chunk")
    graph.add_conditional_edges("extract_from_chunk", _should_continue)
    graph.add_edge("deduplicate", "write_to_db")
    graph.add_edge("write_to_db", END)

    return graph.compile()


def run_pipeline(
    chunks: list[str],
    workflow_name: str,
    department: str,
    owner_name: str = "",
    owner_email: str = "",
    source: str = "",
    source_url: Optional[str] = None,
) -> PipelineState:
    pipeline = build_pipeline()
    initial_state: PipelineState = {
        "chunks": chunks,
        "current_chunk_index": 0,
        "extracted_rules": [],
        "workflow_name": workflow_name,
        "department": department,
        "owner_name": owner_name,
        "owner_email": owner_email,
        "source": source,
        "source_url": source_url,
        "errors": [],
    }
    return pipeline.invoke(initial_state)
