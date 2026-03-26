# Knowledge Capture Pipeline

FastAPI service that extracts business rules from documents and writes them to the wiki's Postgres database.

## Prerequisites

- Python 3.11+
- Ollama running locally with `llama3.2:1b` and `nomic-embed-text` models pulled
- Postgres running with the wiki schema already applied
- The Next.js wiki running at `http://localhost:3000`

## Setup

```bash
cd pipeline
pip install -r requirements.txt
```

Copy `.env` and verify values match your environment:

```
DATABASE_URL=postgresql://wikiuser:wiki2026secure@localhost:5432/knowledge_wiki
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
WIKI_API_URL=http://localhost:3000
EMBED_MODEL=nomic-embed-text
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

## Endpoints

### GET /health

Check service connectivity.

```bash
curl http://localhost:8000/health
```

Response:
```json
{"status": "ok", "ollama": true, "database": true}
```

### GET /workflows

List all workflows stored in the database.

```bash
curl http://localhost:8000/workflows
```

### POST /ingest

Upload a PDF, DOCX, or TXT file for rule extraction.

```bash
curl -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/document.pdf" \
  -F "workflow_name=Invoice Approval" \
  -F "department=Finance" \
  -F "owner_name=Linda Chen" \
  -F "owner_email=linda@company.com"
```

Response:
```json
{
  "job_id": "uuid",
  "filename": "document.pdf",
  "format": "pdf",
  "chunks_processed": 12,
  "rules_extracted": 7,
  "rules_written": 7,
  "errors": [],
  "rules": [...]
}
```

### POST /ingest/text

Submit raw text (email body, meeting notes, etc.) for rule extraction.

```bash
curl -X POST http://localhost:8000/ingest/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "All invoices over $10,000 require CFO approval before payment.",
    "workflow_name": "Invoice Approval",
    "department": "Finance",
    "source": "email from Linda Chen 2026-03-01"
  }'
```

## How it connects to the wiki

1. Reads workflow records from the shared Postgres database (`workflows` table)
2. Writes extracted rules to the `rules` table
3. Calls `POST /api/embed` on the wiki server to generate and store vector embeddings
4. All changes are logged to the `audit_log` table for SOX compliance
