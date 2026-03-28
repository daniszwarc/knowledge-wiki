from typing import Optional
import os
import threading
import uuid
from pathlib import Path

import httpx
from fastapi import APIRouter, Form, HTTPException, UploadFile

from api.schemas import HealthResponse, IngestResponse, IngestTextRequest, WorkflowItem
from db.client import (
    call_article_embed,
    find_workflow_id,
    get_connection,
    insert_article,
    list_workflows,
)
from extract.pipeline import run_pipeline
from extract.prompts import ARTICLE_CONVERSION_PROMPT
from ingest.chunker import chunk_text
from ingest.loader import load_document, load_txt

router = APIRouter()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
UPLOADS_DIR = Path(__file__).resolve().parents[2] / "public" / "uploads"


@router.get("/health", response_model=HealthResponse)
def health():
    ollama_ok = False
    db_ok = False

    try:
        resp = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5.0)
        ollama_ok = resp.status_code == 200
    except Exception:
        pass

    try:
        conn = get_connection()
        conn.close()
        db_ok = True
    except Exception:
        pass

    return HealthResponse(status="ok", ollama=ollama_ok, database=db_ok)


@router.get("/workflows", response_model=list[WorkflowItem])
def workflows():
    try:
        rows = list_workflows()
        return [WorkflowItem(**row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _delete_workflow_if_empty(workflow_name: str) -> None:
    """Delete a workflow by name if it has zero rules."""
    try:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    DELETE FROM workflows
                    WHERE LOWER(name) = LOWER(%s)
                      AND NOT EXISTS (
                        SELECT 1 FROM rules WHERE rules.workflow_id = workflows.id
                      )
                    """,
                    (workflow_name,),
                )
                conn.commit()
        finally:
            conn.close()
    except Exception:
        pass


def _inject_images(markdown: str, image_map: dict) -> str:
    """Replace Figure N references inline; append any unreferenced images at the end."""
    injected: set[str] = set()
    for figure_key, img_url in image_map.items():
        n = figure_key.replace("Figure ", "")
        for pattern in [f"Figure {n}", f"figure {n}", f"Fig. {n}", f"Fig {n}"]:
            if pattern in markdown:
                markdown = markdown.replace(
                    pattern,
                    f"\n\n![{figure_key}]({img_url})\n\n*{figure_key}*\n\n",
                )
                injected.add(figure_key)
                break

    remaining = [(k, v) for k, v in image_map.items() if k not in injected]
    if remaining:
        markdown += "\n\n---\n\n"
        for figure_key, img_url in remaining:
            markdown += f"![{figure_key}]({img_url})\n\n*{figure_key}*\n\n"

    return markdown


def _convert_to_article_content(raw_text: str, title: str) -> Optional[str]:
    """Convert raw text to clean markdown via LLM. Returns None on failure."""
    try:
        resp = httpx.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": ARTICLE_CONVERSION_PROMPT.format(title=title, text=raw_text[:8000]),
                "stream": False,
            },
            timeout=90.0,
        )
        resp.raise_for_status()
        content = resp.json().get("response", "").strip()
        # Strip markdown code fences if the model wraps its output
        if content.startswith("```"):
            lines = content.splitlines()
            content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        return content or None
    except Exception:
        return None


def _save_article(
    raw_text: str,
    workflow_name: str,
    department: str,
    owner_name: str,
    source_filename: str,
    source_url: Optional[str],
    content: Optional[str] = None,
) -> tuple[str, str]:
    """Insert article row and fire embed in background. Returns (article_id, title)."""
    title = workflow_name
    article_content = content or raw_text
    article_id = insert_article(
        title=title,
        department=department,
        workflow_name=workflow_name or None,
        content=article_content,
        source_filename=source_filename,
        source_url=source_url,
        created_by=owner_name or "pipeline",
    )
    threading.Thread(target=call_article_embed, args=(article_id, article_content), daemon=True).start()
    return article_id, title


@router.post("/ingest", response_model=IngestResponse)
async def ingest_file(
    file: UploadFile,
    workflow_name: str = Form(...),
    department: str = Form(...),
    owner_name: str = Form(""),
    owner_email: str = Form(""),
    source: str = Form(""),
):
    data = await file.read()
    filename = file.filename or "upload"
    source = source or filename

    job_id = str(uuid.uuid4())
    upload_dir = UPLOADS_DIR / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(data)
    source_url = f"/uploads/{job_id}/{filename}"

    try:
        doc = load_document(data, filename, job_id=job_id, uploads_dir=UPLOADS_DIR)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse document: {e}")

    if not doc.raw_text.strip():
        raise HTTPException(status_code=422, detail="No text content extracted from document")

    # Step 1: Rule extraction
    chunks = chunk_text(doc.raw_text)
    state: dict = {"extracted_rules": [], "errors": []}
    if chunks:
        state = run_pipeline(
            chunks=chunks,
            workflow_name=workflow_name,
            department=department,
            owner_name=owner_name,
            owner_email=owner_email,
            source=source,
            source_url=source_url,
        )

    rules_extracted = len(state["extracted_rules"])

    # Step 2: Article conversion (inject extracted images if any)
    article_content = _convert_to_article_content(doc.raw_text, workflow_name)
    if article_content and doc.images:
        article_content = _inject_images(article_content, doc.images)

    # Step 3: Decide what to save
    if rules_extracted == 0:
        _delete_workflow_if_empty(workflow_name)
        article_id, title = _save_article(
            raw_text=doc.raw_text,
            workflow_name=workflow_name,
            department=department,
            owner_name=owner_name,
            source_filename=filename,
            source_url=source_url,
            content=article_content,
        )
        return IngestResponse(
            job_id=job_id,
            filename=filename,
            format=doc.format,
            chunks_processed=len(chunks),
            rules_extracted=0,
            rules_written=0,
            errors=state["errors"],
            rules=[],
            source_url=source_url,
            document_type="article",
            article_id=article_id,
            article_title=title,
        )

    rules_written = rules_extracted - len(
        [e for e in state["errors"] if "DB write error" in e]
    )
    workflow_id = find_workflow_id(workflow_name)

    if article_content:
        article_id, title = _save_article(
            raw_text=doc.raw_text,
            workflow_name=workflow_name,
            department=department,
            owner_name=owner_name,
            source_filename=filename,
            source_url=source_url,
            content=article_content,
        )
        return IngestResponse(
            job_id=job_id,
            filename=filename,
            format=doc.format,
            chunks_processed=len(chunks),
            rules_extracted=rules_extracted,
            rules_written=max(0, rules_written),
            errors=state["errors"],
            rules=state["extracted_rules"],
            source_url=source_url,
            document_type="both",
            workflow_id=workflow_id,
            article_id=article_id,
            article_title=title,
        )

    return IngestResponse(
        job_id=job_id,
        filename=filename,
        format=doc.format,
        chunks_processed=len(chunks),
        rules_extracted=rules_extracted,
        rules_written=max(0, rules_written),
        errors=state["errors"],
        rules=state["extracted_rules"],
        source_url=source_url,
        document_type="rules",
        workflow_id=workflow_id,
    )


@router.post("/ingest/text", response_model=IngestResponse)
def ingest_text(body: IngestTextRequest):
    source = body.source or "text input"
    doc = load_txt(body.text.encode("utf-8"), source)

    if not doc.raw_text.strip():
        raise HTTPException(status_code=422, detail="No text content to process")

    job_id = str(uuid.uuid4())

    # Step 1: Rule extraction
    chunks = chunk_text(doc.raw_text)
    state: dict = {"extracted_rules": [], "errors": []}
    if chunks:
        state = run_pipeline(
            chunks=chunks,
            workflow_name=body.workflow_name,
            department=body.department,
            owner_name=body.owner_name,
            owner_email=body.owner_email,
            source=source,
            source_url=None,
        )

    rules_extracted = len(state["extracted_rules"])

    # Step 2: Article conversion
    article_content = _convert_to_article_content(doc.raw_text, body.workflow_name)

    # Step 3: Decide what to save
    if rules_extracted == 0:
        _delete_workflow_if_empty(body.workflow_name)
        article_id, title = _save_article(
            raw_text=doc.raw_text,
            workflow_name=body.workflow_name,
            department=body.department,
            owner_name=body.owner_name,
            source_filename=source,
            source_url=None,
            content=article_content,
        )
        return IngestResponse(
            job_id=job_id,
            filename=source,
            format="txt",
            chunks_processed=len(chunks),
            rules_extracted=0,
            rules_written=0,
            errors=state["errors"],
            rules=[],
            source_url=None,
            document_type="article",
            article_id=article_id,
            article_title=title,
        )

    rules_written = rules_extracted - len(
        [e for e in state["errors"] if "DB write error" in e]
    )
    workflow_id = find_workflow_id(body.workflow_name)

    if article_content:
        article_id, title = _save_article(
            raw_text=doc.raw_text,
            workflow_name=body.workflow_name,
            department=body.department,
            owner_name=body.owner_name,
            source_filename=source,
            source_url=None,
            content=article_content,
        )
        return IngestResponse(
            job_id=job_id,
            filename=source,
            format="txt",
            chunks_processed=len(chunks),
            rules_extracted=rules_extracted,
            rules_written=max(0, rules_written),
            errors=state["errors"],
            rules=state["extracted_rules"],
            source_url=None,
            document_type="both",
            workflow_id=workflow_id,
            article_id=article_id,
            article_title=title,
        )

    return IngestResponse(
        job_id=job_id,
        filename=source,
        format="txt",
        chunks_processed=len(chunks),
        rules_extracted=rules_extracted,
        rules_written=max(0, rules_written),
        errors=state["errors"],
        rules=state["extracted_rules"],
        source_url=None,
        document_type="rules",
        workflow_id=workflow_id,
    )
