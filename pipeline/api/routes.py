import os
import uuid
from pathlib import Path

import httpx
from fastapi import APIRouter, Form, HTTPException, UploadFile

from api.schemas import ArticleIngestResponse, HealthResponse, IngestResponse, IngestTextRequest, WorkflowItem
from db.client import call_article_embed, get_connection, insert_article, list_workflows
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

    try:
        doc = load_document(data, filename)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse document: {e}")

    chunks = chunk_text(doc.raw_text)
    if not chunks:
        raise HTTPException(status_code=422, detail="No text content extracted from document")

    job_id = str(uuid.uuid4())

    upload_dir = UPLOADS_DIR / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(data)
    source_url = f"/uploads/{job_id}/{filename}"

    state = run_pipeline(
        chunks=chunks,
        workflow_name=workflow_name,
        department=department,
        owner_name=owner_name,
        owner_email=owner_email,
        source=source,
        source_url=source_url,
    )

    rules_written = len(state["extracted_rules"]) - len(
        [e for e in state["errors"] if "DB write error" in e]
    )

    return IngestResponse(
        job_id=job_id,
        filename=filename,
        format=doc.format,
        chunks_processed=len(chunks),
        rules_extracted=len(state["extracted_rules"]),
        rules_written=max(0, rules_written),
        errors=state["errors"],
        rules=state["extracted_rules"],
        source_url=source_url,
    )


@router.post("/ingest/article", response_model=ArticleIngestResponse)
async def ingest_article(
    file: UploadFile,
    title: str = Form(...),
    department: str = Form(...),
    workflow_name: str = Form(""),
    created_by: str = Form("pipeline"),
):
    data = await file.read()
    filename = file.filename or "upload"

    try:
        doc = load_document(data, filename)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse document: {e}")

    if not doc.raw_text.strip():
        raise HTTPException(status_code=422, detail="No text content extracted from document")

    # Convert raw text to structured markdown via Ollama
    prompt = ARTICLE_CONVERSION_PROMPT.format(title=title, text=doc.raw_text)
    try:
        resp = httpx.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=120.0,
        )
        resp.raise_for_status()
        markdown_content = resp.json().get("response", doc.raw_text)
    except Exception:
        # Fall back to raw text if LLM call fails
        markdown_content = doc.raw_text

    job_id = str(uuid.uuid4())
    upload_dir = UPLOADS_DIR / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(data)
    source_url = f"/uploads/{job_id}/{filename}"

    article_id = insert_article(
        title=title,
        department=department,
        workflow_name=workflow_name,
        content=markdown_content,
        source_filename=filename,
        source_url=source_url,
        created_by=created_by,
    )

    call_article_embed(article_id, markdown_content)

    word_count = len(markdown_content.split())
    return ArticleIngestResponse(
        article_id=article_id,
        title=title,
        word_count=word_count,
        source_url=source_url,
    )


@router.post("/ingest/text", response_model=IngestResponse)
def ingest_text(body: IngestTextRequest):
    source = body.source or "text input"
    doc = load_txt(body.text.encode("utf-8"), source)
    chunks = chunk_text(doc.raw_text)

    if not chunks:
        raise HTTPException(status_code=422, detail="No text content to process")

    job_id = str(uuid.uuid4())
    state = run_pipeline(
        chunks=chunks,
        workflow_name=body.workflow_name,
        department=body.department,
        owner_name=body.owner_name,
        owner_email=body.owner_email,
        source=source,
        source_url=None,
    )

    rules_written = len(state["extracted_rules"]) - len(
        [e for e in state["errors"] if "DB write error" in e]
    )

    return IngestResponse(
        job_id=job_id,
        filename=source,
        format="txt",
        chunks_processed=len(chunks),
        rules_extracted=len(state["extracted_rules"]),
        rules_written=max(0, rules_written),
        errors=state["errors"],
        rules=state["extracted_rules"],
        source_url=None,
    )
