from typing import Optional
import os
import re
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

from ingest.chunker import chunk_text
from ingest.loader import load_document, load_txt

router = APIRouter()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
WIKI_API_URL = os.getenv("WIKI_API_URL", "http://localhost:3000")
UPLOADS_DIR = Path(__file__).resolve().parents[2] / "public" / "uploads"


def _trigger_narrative(workflow_id: str) -> None:
    """Fire-and-forget: ask the wiki to regenerate the process narrative."""
    try:
        httpx.post(
            f"{WIKI_API_URL}/api/workflows/{workflow_id}/generate-narrative",
            timeout=5.0,
        )
    except Exception:
        pass


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


def convert_to_markdown(raw_text: str, image_map: dict) -> str:
    # Clean up the raw text first
    lines = raw_text.split('\n')
    cleaned = []

    skip_patterns = [
        'Business Applications',
        'Source: IS Department API Group',
        'Page 1 of', 'Page 2 of', 'Page 3 of',
        'Page 4 of', 'Page 5 of', 'Page 6 of',
        'Page 7 of', 'Page 8 of', 'Page 9 of',
        'Continue of',
        'Click here to learn more about selection screens',
        'Excel Help for AS400',
    ]

    for line in lines:
        line = line.strip()
        if not line:
            cleaned.append('')
            continue
        if any(p in line for p in skip_patterns):
            continue
        if re.match(r'^\d+/\d+$', line):
            continue
        cleaned.append(line)

    # Remove consecutive blank lines
    text = '\n'.join(cleaned)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Now convert to markdown structure
    output = []
    lines = text.split('\n')
    i = 0

    while i < len(lines):
        line = lines[i]

        if not line:
            output.append('')
            i += 1
            continue

        # Figure references — replace with image tag
        fig_match = re.match(
            r'^(Figure\s+(\d+))[:\s\-]*(.*)?$',
            line, re.IGNORECASE
        )
        if fig_match:
            fig_num = fig_match.group(2)
            fig_key = f"Figure {fig_num}"
            caption = fig_match.group(3).strip()
            if fig_key in image_map:
                img_url = image_map[fig_key]
                cap_text = caption if caption else fig_key
                output.append(f'\n![{cap_text}]({img_url})\n')
            i += 1
            continue

        # Numbered steps: "1.", "2.", "3." etc
        num_match = re.match(r'^(\d+)\.\s+(.+)$', line)
        if num_match:
            output.append(f'{num_match.group(1)}. {num_match.group(2)}')
            i += 1
            continue

        # -OR- separators
        if line == '-OR-':
            output.append('\n*or*\n')
            i += 1
            continue

        # Bullet points starting with filled square or dash
        if line.startswith('▪') or line.startswith('■'):
            output.append(f'- {line[1:].strip()}')
            i += 1
            continue

        # Section headings: short lines, title case, no period
        if (len(line) < 80
                and not line.endswith('.')
                and not line.endswith(',')
                and not line[0].isdigit()
                and not line.startswith('-')
                and sum(1 for c in line if c.isupper()) > 1):
            output.append(f'\n## {line}\n')
            i += 1
            continue

        output.append(line)
        i += 1

    return '\n'.join(output)





def _save_article(
    raw_text: str,
    workflow_name: str,
    department: str,
    owner_name: str,
    source_filename: str,
    source_url: Optional[str],
    content: Optional[str] = None,
    article_type: str = "how_to_guide",
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
        article_type=article_type,
    )
    threading.Thread(target=call_article_embed, args=(article_id, article_content), daemon=True).start()
    return article_id, title


@router.post("/ingest", response_model=IngestResponse)
async def ingest_file(
    file: UploadFile,
    workflow_name: str = Form(...),
    department: str = Form(...),
    article_type: str = Form("how_to_guide"),
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
        doc = load_document(data, filename, job_id=job_id, uploads_dir=upload_dir)
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

    # Step 2: Article conversion
    article_content = convert_to_markdown(doc.raw_text, doc.images)

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
            article_type=article_type,
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

    if workflow_id:
        threading.Thread(target=_trigger_narrative, args=(workflow_id,), daemon=True).start()

    if article_content:
        article_id, title = _save_article(
            raw_text=doc.raw_text,
            workflow_name=workflow_name,
            department=department,
            owner_name=owner_name,
            source_filename=filename,
            source_url=source_url,
            content=article_content,
            article_type=article_type,
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
    article_content = convert_to_markdown(doc.raw_text, {})

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
            article_type=body.article_type,
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

    if workflow_id:
        threading.Thread(target=_trigger_narrative, args=(workflow_id,), daemon=True).start()

    if article_content:
        article_id, title = _save_article(
            raw_text=doc.raw_text,
            workflow_name=body.workflow_name,
            department=body.department,
            owner_name=body.owner_name,
            source_filename=source,
            source_url=None,
            content=article_content,
            article_type=body.article_type,
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
