# APi GROUP — Knowledge Wiki

## Overview

APi GROUP Knowledge Wiki is an internal SOX-compliant knowledge base that captures, structures, and surfaces organisational rules and workflows extracted from source documents. It is designed for teams operating under compliance requirements where auditability, validation traceability, and role-based access to process documentation are mandatory.

The system answers the question: "What are the documented rules governing this business process, and who confirmed them?" Staff can find process rules by searching, browsing by department, or asking the AI assistant questions grounded in the extracted documentation. Compliance and audit teams can track which rules have been stakeholder-validated, which have been flagged as outdated, and what gaps remain undocumented.

All data and authentication remain on-premises. LLM inference is handled via the NaN Builders API (no data sent to external cloud providers).

---

## Architecture

The system comprises three components:

**Next.js wiki** — The primary interface, served on port 3000. Handles user authentication (email + password + TOTP 2FA), role-based access control, workflow browsing, semantic search, AI-assisted chat, rule validation, document upload, and article publishing. Implemented as a Next.js 16 App Router application with TypeScript and Tailwind CSS 4.

**FastAPI pipeline** — A separate Python service on port 8000 that accepts documents via HTTP and handles two modes of ingestion: rule extraction using a LangGraph pipeline, and article conversion that publishes full documents as structured wiki articles. Accepts PDF, DOCX, and TXT input.

**PostgreSQL 17 with pgvector** — The shared knowledge base. Stores workflows, rules, articles, validation history, gaps, experts, sessions, users, and a full audit log. The pgvector extension stores 4096-dimensional embeddings for semantic search.

**NaN Builders API** — Remote LLM inference. Used for rule extraction, article conversion, the wiki AI assistant, and embedding generation. No Ollama local instance required.

### Data flow

```
Source document (PDF / DOCX / TXT)
  → POST /ingest  (FastAPI pipeline, port 8000)
  → LangGraph extraction / LLM conversion  (NaN Builders API — qwen3.6)
  → Rules or articles written to PostgreSQL with embeddings  (qwen3-embedding)
  → Wiki displays, searches, and validates content  (Next.js, port 3000)
```

---

## Prerequisites

- Docker and Docker Compose
- A NaN Builders API key (`https://api.nan.builders`)
- A domain with DNS pointing to your server
- Traefik running on the server (for TLS termination)

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `POSTGRES_DB` | Database name (e.g. `knowledge_wiki`) |
| `POSTGRES_USER` | Database user (e.g. `wikiuser`) |
| `POSTGRES_PASSWORD` | Database password |
| `NEXTAUTH_SECRET` | Random 32+ character string for session signing |
| `NEXTAUTH_URL` | Full public URL (e.g. `https://wiki.yourdomain.com`) |
| `OLLAMA_BASE_URL` | NaN Builders base URL: `https://api.nan.builders/v1` |
| `OLLAMA_CHAT_MODEL` | Chat model: `qwen3.6` |
| `OLLAMA_EMBED_MODEL` | Embedding model: `qwen3-embedding` |
| `OLLAMA_MODEL` | Same as `OLLAMA_CHAT_MODEL` |
| `LLM_API_KEY` | Your NaN Builders API key |

---

## Deployment

### Fresh deployment on a VPS

#### Prerequisites on the server

- Docker and Docker Compose installed
- Traefik running with a TLS certificate resolver named `mytlschallenge`
- The `n8n_default` Docker network exists (or adjust `docker-compose.yml` to use your network)
- DNS record for your subdomain pointing to the server IP

#### Steps

```bash
git clone https://github.com/daniszwarc/knowledge-wiki /docker/apiwiki
cd /docker/apiwiki
mkdir -p uploads
cp .env.example .env
```

Edit `.env` with your values, then:

```bash
docker compose up -d --build
docker compose exec wiki npx tsx scripts/migrate.ts
docker compose exec wiki npx tsx scripts/seed-admin.ts
```

The wiki will be available at the domain configured in `NEXTAUTH_URL`.

### Updating an existing deployment

```bash
cd /docker/apiwiki
git pull
docker compose up -d --build
```

Run migrations if the update includes schema changes:

```bash
docker compose exec wiki npx tsx scripts/migrate.ts
```

### Viewing logs

```bash
docker compose logs wiki
docker compose logs pipeline
docker compose logs postgres
```

---

## First Login

Default admin credentials:

```
Email:    admin@company.com
Password: Admin1234!
```

On first login you will be prompted to set up TOTP two-factor authentication. Scan the QR code with Google Authenticator, Authy, or any TOTP-compatible app, then enter the six-digit code to activate 2FA and complete login.

**Change the default password immediately** after first login via the Admin panel at `/admin/users`.

---

## Authentication

**Email + password + TOTP 2FA** — All access requires an email address, password, and a six-digit TOTP code from an authenticator app. 2FA is configured on first login and cannot be bypassed.

**Session expiry** — Authenticated sessions expire after eight hours.

**Creating new users** — Only admins can create user accounts. Navigate to `/admin/users`, click "New user", enter the email address and a temporary password, and assign a role. The new user will be prompted to configure 2FA on first login.

---

## User Roles

| Role | Read | Validate | Upload | Delete rules | Manage users |
|---|:---:|:---:|:---:|:---:|:---:|
| Viewer | ✓ | | | | |
| Validator | ✓ | ✓ | ✓ | | |
| Editor | ✓ | ✓ | ✓ | ✓ | |
| Developer | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Super Admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Company Admin | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Ingesting Documents

Navigate to **Add document** in the sidebar. Select the document type before uploading.

### Process document — extract business rules

Use when the goal is to extract structured rules from a source document and add them to a workflow's knowledge base. Provide a workflow name and select a department. Accepts PDF, DOCX, and TXT.

### Reference article — publish a full document

Use when the source document should be preserved and published as a searchable wiki article. The document is converted to structured HTML and stored as a single article with its own page. Provide a title and select a department.

### SED — Small Enhancement Document

Use for DOCX-format SEDs. Fields are extracted automatically: project title, story number, INC ticket, CAB ticket, requestor, programmer, business requirements, IT design, and testing notes.

---

## Uploads Storage

Uploaded files and extracted images are stored in the `uploads/` directory on the host, which is bind-mounted into both the wiki and pipeline containers at `/app/public/uploads`. This directory must exist on the host before starting the stack:

```bash
mkdir -p /docker/apiwiki/uploads
```

Images embedded in documents are extracted during ingestion and served via the `/api/uploads/` route.

---

## Security

**Authentication** — Email + password + TOTP 2FA enforced on all routes. Sessions stored in PostgreSQL, identified by a cryptographically random token in an httpOnly, secure cookie.

**Middleware** — Every request to a protected route is validated against the session table. Role checks enforced at the middleware layer.

**Audit log** — All INSERT, UPDATE, and DELETE operations on `rules`, `workflows`, and `articles` are recorded automatically with timestamp, user, and before/after values.

**Data residency** — All data is stored in a local PostgreSQL instance. LLM inference uses the NaN Builders API; no document content is sent to any other external service.

---

## SOX Compliance Notes

- **Audit trail** — The `audit_log` table records every modification with previous and new state.
- **Validation records** — Stakeholder validations record the validator's name and timestamp as a named attestation.
- **Gaps reporting** — The Flagged gaps view documents known missing or outdated documentation.
- **Role separation** — Viewers cannot modify data. Only Admins can manage user accounts and roles.

These properties do not constitute legal compliance certification. Consult your compliance team to confirm that the system's controls satisfy your specific audit requirements.

---

## Known Limitations

- No email notifications when rules are flagged or validation is requested
- No gap resolution UI — gaps must be closed directly in the database
- No rule editing — delete and re-ingest the corrected source document to update a rule
- Interface is designed for desktop use and is not optimised for small screens

---

## License

Internal use only. Not for distribution.