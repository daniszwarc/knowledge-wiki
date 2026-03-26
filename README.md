# Knowledge Wiki

## Overview

Knowledge Wiki is an internal business process documentation system that captures, structures, and surfaces organisational rules and workflows extracted from source documents. It is designed for teams operating under compliance requirements — including SOX — where auditability, validation traceability, and role-based access to process documentation are mandatory.

The system answers the question: "What are the documented rules governing this business process, and who confirmed them?" Staff can find process rules by searching, browsing by department, or asking the AI assistant questions grounded in the extracted documentation. Compliance and audit teams can track which rules have been stakeholder-validated, which have been flagged as outdated, and what gaps remain undocumented.

All data, inference, and authentication remain on-premises. No content is sent to external APIs.

---

## Architecture

The system comprises four components:

**Next.js wiki** — The primary interface, served on port 3000. Handles user authentication, role-based access control, workflow browsing, semantic search, AI-assisted chat, rule validation, and document upload. Implemented as a Next.js 16 App Router application with TypeScript and Tailwind CSS 4. API routes handle all data access and authentication logic.

**FastAPI pipeline** — A separate Python service on port 8000 that accepts documents via HTTP, extracts structured business rules using a LangGraph pipeline backed by a local Ollama model, and writes the results to Postgres. It handles PDF, Word, and plain text input.

**Postgres with pgvector** — The shared knowledge base. Stores workflows, rules, validation history, gaps, experts, sessions, users, and a full audit log. The pgvector extension stores 768-dimensional embeddings alongside each rule for semantic search.

**Ollama** — Local LLM inference server. Two models are required: a chat model for rule extraction and the wiki AI assistant, and an embedding model for vectorising rules at ingest time and queries at search time.

### Data flow

```
Source document (PDF / DOCX / text)
  -> POST /ingest  (FastAPI pipeline, port 8000)
  -> LangGraph extraction pipeline  (Ollama chat model)
  -> Rules written to Postgres with embeddings  (Ollama embed model)
  -> Wiki displays, searches, and validates rules  (Next.js, port 3000)
```

---

## Prerequisites

- Node.js 20 or later
- Python 3.11 or later
- PostgreSQL 17 with the pgvector extension installed
- Ollama running locally

### Required Ollama models

Pull both models before starting:

```bash
ollama pull llama3.2:latest
ollama pull nomic-embed-text
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd APiWiki
```

### 2. Database setup

Create the database:

```bash
createdb apiwiki
```

Run the schema migration:

```bash
npx tsx scripts/migrate.ts
```

Seed sample workflow and rule data:

```bash
npx tsx scripts/seed.ts
```

Create the default admin user:

```bash
npx tsx scripts/seed-admin.ts
```

### 3. Environment variables

Create `.env.local` in the project root:

```env
DATABASE_URL=postgresql://localhost:5432/apiwiki
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=llama3.2:latest
OLLAMA_EMBED_MODEL=nomic-embed-text
NEXTAUTH_SECRET=<generate a random 32+ character string>
```

Create `pipeline/.env`:

```env
DATABASE_URL=postgresql://localhost:5432/apiwiki
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
EMBED_MODEL=nomic-embed-text
WIKI_API_URL=http://localhost:3000
```

### 4. Start the wiki

```bash
npm install
npm run dev
```

The wiki is available at `http://localhost:3000`. All routes redirect to `/login` until authenticated.

### 5. Start the pipeline

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Confirm the pipeline is ready:

```bash
curl http://localhost:8000/health
```

### 6. First login

Default admin credentials:

```
Email:    admin@company.com
Password: Admin1234!
```

On first login you will be prompted to set up TOTP two-factor authentication. Scan the QR code with Google Authenticator, Authy, or any TOTP-compatible app, then enter the six-digit code to activate 2FA and complete login.

Change the default password immediately after first login via the Admin panel at `/admin/users`.

---

## User Roles

| Role      | Read rules | Validate and flag | Delete rules | Manage users |
|-----------|:----------:|:-----------------:|:------------:|:------------:|
| Viewer    | Yes        | No                | No           | No           |
| Validator | Yes        | Yes               | No           | No           |
| Editor    | Yes        | Yes               | Yes          | No           |
| Admin     | Yes        | Yes               | Yes          | Yes          |

Roles are assigned by an admin at `/admin/users`. Users created by an admin default to the Viewer role.

---

## Ingesting Documents

### Via the wiki UI

The homepage provides a document upload panel with two tabs:

**Upload file** — Accepts PDF, DOCX, and TXT files. Provide a workflow name and department before uploading. The file is sent to the pipeline, which extracts rules and writes them to the knowledge base. A progress bar tracks extraction stages.

**Paste text** — For email bodies, meeting notes, or any plain text that does not exist as a file. Additional optional fields accept owner name, owner email, and a source reference string.

### Via the pipeline API directly

Upload a file:

```bash
curl -X POST http://localhost:8000/ingest \
  -F "file=@document.pdf" \
  -F "workflow_name=Invoice Approval" \
  -F "department=Finance" \
  -F "owner_name=Jane Smith" \
  -F "owner_email=jane.smith@company.com"
```

Ingest plain text:

```bash
curl -X POST http://localhost:8000/ingest/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "All invoices above 10,000 GBP require dual approval...",
    "workflow_name": "Invoice Approval",
    "department": "Finance",
    "owner_name": "Jane Smith",
    "owner_email": "jane.smith@company.com",
    "source": "Finance Policy v3.2"
  }'
```

Both endpoints return a summary including `rules_extracted` and `rules_written` counts, plus any per-chunk errors.

### Supported formats

- PDF (parsed via PyMuPDF)
- Word documents (.docx, parsed via python-docx)
- Plain text (.txt)
- Raw text input via the paste tab or the `/ingest/text` endpoint

---

## Knowledge Base Structure

### Workflows

A workflow represents a discrete business process, such as "Invoice Approval" or "New Employee Onboarding". Each workflow belongs to a department and groups related rules. The completeness score shown on each workflow card is calculated dynamically as the percentage of rules that have been stakeholder-validated.

### Rules

A rule is a single extracted statement from source documentation. Each rule carries:

- A summary (one sentence) and optional extended detail
- A rule type (e.g., approval, control, exception, requirement)
- A confidence level (high, medium, low) assigned by the extraction model
- Validation status — unvalidated until a named stakeholder confirms it
- Owner name and email
- A link back to the source document if uploaded via file

### Gaps

A gap is created when a user flags a rule as outdated during the validation review, or when a reviewer identifies a policy area with no documented rules. Gaps appear in the Flagged gaps view and are tracked with an open status. Resolving gaps currently requires direct database access; a resolution UI is planned.

### Experts

The Experts directory lists subject matter experts and process owners by department and domain. Risk levels (critical, high, medium, low) indicate the business impact of knowledge held by each expert, useful for identifying single points of failure in institutional knowledge.

---

## Search

The search bar at the top of the homepage performs hybrid search combining full-text keyword matching and semantic vector similarity. Results are ranked using Reciprocal Rank Fusion (RRF), which merges both result lists into a single relevance-ordered output.

Type a query and press Enter. Each result shows the matching rule, its workflow, department, rule type, owner, and validation status.

The "Help me find a process" chat panel on the homepage accepts natural language questions and returns a streamed response. Use it to navigate to relevant workflows when the exact workflow name is unknown.

---

## AI Chat

Each workflow page includes an AI assistant panel. Ask questions about the process documented in that workflow. The assistant answers using only the rules stored for that workflow — it has no access to general knowledge and will not answer questions about topics not represented in the extracted rules.

Example questions:

- "Who is responsible for approvals?"
- "What are the key controls in this process?"
- "What happens if a rule is violated?"

If a question matches multiple rules, all relevant rules are presented. If the documented rules do not contain the answer, the assistant says so and suggests contacting the process owner.

### Known limitations with local models

Llama 3.2 running locally is less reliable than cloud-hosted models at maintaining strict grounding. It may occasionally draw on training knowledge rather than limiting itself to the provided rules. The system prompt is designed to minimise this, but responses should be verified against the displayed rule cards for compliance-critical queries.

---

## Security

**Authentication** — All access requires email and password plus TOTP two-factor authentication (Google Authenticator, Authy, or any RFC 6238 TOTP app). 2FA is enforced on first login and cannot be bypassed. Admins can reset a user's 2FA from the user management panel, which triggers re-setup on next login.

**Sessions** — Sessions are stored in Postgres, expire after eight hours, and are identified by a cryptographically random token stored as an httpOnly cookie. The token hash is stored in the database; the raw token never persists server-side.

**Middleware** — Every request to a protected route is validated against the session table before being served. Role checks are enforced at the middleware layer, not only in the UI.

**Prompt injection protection** — The chat endpoint applies input filtering to detect common prompt injection patterns before forwarding requests to the local model. The system prompt frames the model's knowledge as a fixed, closed set of facts.

**Audit log** — All INSERT, UPDATE, and DELETE operations on the `rules` and `workflows` tables are recorded automatically via Postgres triggers. Each entry captures the table name, record ID, action, timestamp, and both the previous and new values as JSONB.

**Data residency** — No content, embeddings, or queries leave the server. All LLM inference runs locally via Ollama. All data is stored in a local Postgres instance.

---

## SOX Compliance Notes

The system is designed to support SOX documentation and evidence requirements:

- **Audit trail** — The `audit_log` table records every modification to rules and workflows with the previous and new state, providing a tamper-evident history of the knowledge base.
- **Validation records** — When a stakeholder validates a rule, their name and the timestamp are recorded. This creates a named attestation for each documented control.
- **Gaps reporting** — The Flagged gaps view documents what is known to be missing or outdated. This is evidence that the organisation is actively tracking its documentation gaps.
- **Role separation** — Viewers cannot modify any data. Validators can confirm or flag rules but cannot delete them. Only Editors and Admins can delete rules. Admins alone can manage user accounts and roles.

These properties do not constitute legal compliance certification. Consult your compliance team to confirm that the system's controls satisfy your specific audit requirements.

---

## Regenerating Embeddings

If semantic search quality degrades, or if rules were ingested before the embedding model was configured, run:

```bash
npx tsx scripts/regenerate-embeddings.ts
```

This re-embeds all rules in the database using the configured `OLLAMA_EMBED_MODEL` and updates the vector index.

---

## Known Limitations

- **Local LLM quality** — Llama 3.2 may produce responses that go beyond the documented rules despite the grounding prompt. Cloud-hosted models are significantly more reliable for strict grounding use cases.
- **Prompt injection robustness** — Local models are less resistant to adversarial inputs than cloud models. The current input filtering provides a baseline defence but is not a complete mitigation.
- **No email notifications** — There is no mechanism to notify process owners when their rules are flagged or when validation is requested.
- **No gap resolution UI** — Gaps can be created through the UI but must be closed by updating the `gaps` table directly in the database.
- **No rule editing** — Rules cannot be edited in place. To correct an extracted rule, delete it via the Validation review page and re-ingest the corrected source document.
- **No mobile layout** — The interface is designed for desktop use and is not optimised for small screens.

---

## Roadmap

- Docker containerisation for all four components
- Email notifications when rules are flagged or validation is requested
- Gap resolution workflow in the UI
- Rule editing UI
- Mobile-responsive layout
- Support for additional document formats (Excel, PowerPoint)

---

## License

Internal use only. Not for distribution.
