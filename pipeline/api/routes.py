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
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:270m")
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



def convert_to_html(raw_text: str, image_map: dict) -> str:
    # Step 1: inject [FIGURE_N] markers — consume surrounding parens too
    text = re.sub(
        r'\(?\s*Figure\s+(\d+)[^)\n]*\)?',
        lambda m: f'[FIGURE_{m.group(1)}]',
        raw_text,
        flags=re.IGNORECASE,
    )

    # Step 2: remove boilerplate lines
    skip_patterns = [
        'Business Applications',
        'Source: IS Department API Group',
        'Continue of',
        'Click here to learn more',
        'Excel Help for AS400',
    ]
    page_pattern = re.compile(r'Page \d+ of \d+')

    # Strip non-latin unicode garbage (checkbox symbols, box-drawing chars, etc.)
    # Keep ASCII, extended Latin, en/em dashes, and smart quotes
    text = re.sub(r'[^\x00-\x7F\u00C0-\u024F\u2013\u2014\u2018\u2019\u201C\u201D]', '', text)

    cleaned = []
    for line in text.split('\n'):
        line = line.strip()
        if any(p in line for p in skip_patterns):
            continue
        if page_pattern.search(line):
            continue
        if re.match(r'^\d+/\d+$', line):
            continue
        cleaned.append(line)

    # Step 3: reassemble into paragraphs
    paragraphs = []
    current: list = []

    def _flush() -> None:
        para = ' '.join(current).strip()
        if para:
            paragraphs.append(para)
        current.clear()

    def _starts_new_paragraph(line: str, prev: str) -> bool:
        if not line:
            return True
        if re.match(r'^\d+[\. ]', line):
            return True
        if re.match(r'^\[FIGURE_\d+\]$', line):
            return True
        if line == '-OR-':
            return True
        if prev.endswith('.') and line and line[0].isupper():
            return True
        return False

    prev_line = ''
    i = 0
    while i < len(cleaned):
        line = cleaned[i]
        # Fix 1: short numbered line ("5.") — merge with next non-empty line
        if re.match(r'^\d+\.$', line.strip()) and len(line.strip()) < 10:
            j = i + 1
            while j < len(cleaned) and not cleaned[j].strip():
                j += 1
            if j < len(cleaned):
                line = line.strip() + ' ' + cleaned[j].strip()
                i = j  # skip the consumed line
        if _starts_new_paragraph(line, prev_line):
            _flush()
            if line:
                current.append(line)
        else:
            current.append(line)
        prev_line = line
        i += 1
    _flush()

    # Step 4: convert paragraphs to HTML
    # Fix 4: shared set to deduplicate figures across both block and inline passes
    rendered_figures: set = set()

    def _figure_tag(n: str) -> str:
        if n in rendered_figures:
            return ''
        fig_key = f"Figure {n}"
        entry = image_map.get(fig_key)
        if not entry:
            return ''
        rendered_figures.add(n)
        url = entry["url"] if isinstance(entry, dict) else entry
        return (
            f'<figure style="margin:24px 0;">'
            f'<img src="{url}" alt="Figure {n}" '
            f'style="max-width:100%;border-radius:8px;border:1px solid #e5e7eb;" />'
            f'</figure>'
        )

    output = []
    for para in paragraphs:
        if not para:
            continue

        fig_match = re.match(r'^\[FIGURE_(\d+)\]$', para)
        if fig_match:
            tag = _figure_tag(fig_match.group(1))
            if tag:
                output.append(tag)
            continue

        num_match = re.match(r'^(\d+)[\. ]\s*(.+)$', para)
        if num_match:
            output.append(f'<p><strong>{num_match.group(1)}.</strong> {num_match.group(2)}</p>')
            continue

        if para == '-OR-':
            output.append('<p><em>— or —</em></p>')
            continue

        if len(para) < 60 and not para.endswith('.'):
            output.append(f'<h2>{para}</h2>')
            continue

        output.append(f'<p>{para}</p>')

    html = '\n'.join(output)

    # Step 5: replace any remaining inline [FIGURE_N] (dedup shared via rendered_figures)
    def _replace_inline(m: re.Match) -> str:
        return _figure_tag(m.group(1))

    html = re.sub(r'\[FIGURE_(\d+)\]', _replace_inline, html)

    return html





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
    article_content = convert_to_html(doc.raw_text, doc.images)

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
    article_content = convert_to_html(doc.raw_text, {})

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
