# APiWiki Security Audit
Date: 2026-05-08

## Summary

13 issues found across the application and its dependencies: 7 High and 3 Medium. The most operationally dangerous findings are (a) no brute-force protection on the authentication endpoints (the wiki is internet-facing via Traefik), (b) a missing role check on the rules DELETE endpoint that allows any authenticated user to delete SOX-tracked rules, and (c) an outdated python-multipart with a Critical-rated Content-Type DoS vulnerability on the pipeline's file-upload handler. Three additional High findings come from outdated JavaScript dependencies (Next.js, path-to-regexp, lodash). Medium findings cover CORS misconfiguration on the internal pipeline, public cache headers on uploaded SOX documents, and admin/audit routes that carry no in-route session defense.

---

## Findings

### [HIGH] — No brute-force protection on login and TOTP endpoints

- **File:** [app/api/auth/login/route.ts](app/api/auth/login/route.ts) (entire file) and [app/api/auth/verify-totp/route.ts](app/api/auth/verify-totp/route.ts) (entire file)
- **Risk:** An attacker on the internet can hammer both endpoints without limit — password spraying against `/login` and TOTP code enumeration (10,000 possible 6-digit codes) against `/verify-totp`.
- **Fix:** Add an in-memory (or Redis-backed) rate limiter before the database call. For the login endpoint:
  ```ts
  // at top of route module
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();

  export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const now = Date.now();
    const window = loginAttempts.get(ip) ?? { count: 0, resetAt: now + 60_000 };
    if (now > window.resetAt) { window.count = 0; window.resetAt = now + 60_000; }
    if (++window.count > 10) {
      loginAttempts.set(ip, window);
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    loginAttempts.set(ip, window);
    // ... existing logic
  }
  ```
  Apply the same pattern to `verify-totp/route.ts` with a stricter limit (e.g., 5 attempts per 5 minutes per `wiki_temp` cookie value, then delete the temp token on lockout).

---

### [HIGH] — Rules DELETE has no role check — any authenticated user can delete SOX-tracked rules

- **File:** [app/api/rules/[id]/route.ts:9-14](app/api/rules/%5Bid%5D/route.ts)
- **Risk:** Any logged-in user (including `viewer` and `validator` roles) can permanently delete rules; because rules are SOX-audited this violates the compliance requirement that destructive actions require elevated privilege.
- **Fix:** Add a role guard immediately after session validation:
  ```ts
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ADD THIS:
  if (!["editor", "admin", "developer"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  ```

---

### [HIGH] — npm: Next.js 16.2.1 vulnerable to Denial of Service (GHSA-q4gf-8mx6-v5v3)

- **File:** [package.json](package.json) — `"next": "16.2.1"` installed
- **Risk:** A malicious Server Components payload can crash the Next.js rendering worker, taking the wiki offline for all users.
- **Fix:** Update Next.js to the patched release:
  ```bash
  npm install next@16.2.6
  ```

---

### [HIGH] — npm: path-to-regexp 0.1.12 vulnerable to ReDoS (GHSA-37ch-88jc-xwx2)

- **File:** [package.json](package.json) — transitive dependency, installed version 0.1.12
- **Risk:** A crafted URL with multiple route parameters triggers catastrophic backtracking in the regex engine, blocking the Node.js event loop and denying service.
- **Fix:**
  ```bash
  npm install path-to-regexp@0.1.13
  # or upgrade the top-level dependency that pins this version
  npm audit fix
  ```

---

### [HIGH] — npm: lodash 4.17.23 Code Injection via `_.template` (GHSA-r5fr-rjxr-66jc, CVSS 8.1)

- **File:** [package.json](package.json) — transitive dependency, installed version 4.17.23
- **Risk:** If any dependency passes user-controlled key names into `_.template`, an attacker can execute arbitrary code in the Node.js process.
- **Fix:**
  ```bash
  npm audit fix
  # if blocked by a peer, force-resolve:
  npm install lodash@4.17.21  # latest patched in the 4.x line per the advisory
  ```
  Pin lodash to the latest patched version in `package.json` overrides if the direct dependency cannot be updated.

---

### [HIGH] — pip: python-multipart 0.0.9 — four unpatched CVEs, including Critical Content-Type DoS (GHSA-pp6c-gr5w-3c5g)

- **File:** [pipeline/requirements.txt](pipeline/requirements.txt) — `python-multipart==0.0.9`
- **Risk:** An attacker (or rogue internal client) who can send a crafted `Content-Type` header to the FastAPI `/ingest` endpoint can cause unbounded CPU consumption, crashing the pipeline worker; older CVEs in the same package cover ReDoS in boundary parsing and Content-Disposition header processing.
- **Fix:** Pin to the latest patched release. In `requirements.txt`:
  ```
  python-multipart>=0.0.27
  ```
  Then rebuild:
  ```bash
  pip install -r requirements.txt --upgrade
  ```

---

### [HIGH] — pip: starlette 0.38.6 vulnerable to authorization bypass (GHSA-2c2j-9gv5-cj73)

- **File:** [pipeline/requirements.txt](pipeline/requirements.txt) — `starlette==0.38.6` (via FastAPI 0.115.0)
- **Risk:** A timing side-channel in Starlette's routing or middleware layer can allow an attacker to infer valid route paths or bypass authorization checks on internal API routes.
- **Fix:** Upgrade Starlette (and FastAPI) in `requirements.txt`:
  ```
  fastapi>=0.115.6
  starlette>=0.40.0
  ```

---

### [MEDIUM] — CORS `allow_origins=["*"]` on the pipeline API

- **File:** [pipeline/main.py:14](pipeline/main.py)
- **Risk:** Any origin is permitted to make cross-origin requests to the FastAPI service; if the pipeline is ever accidentally exposed via Traefik or accessed from a compromised internal service, any website can call its endpoints without restriction.
- **Fix:** Replace the wildcard with the explicit internal wiki origin:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://wiki:3000"],
      allow_methods=["POST"],
      allow_headers=["Content-Type"],
  )
  ```

---

### [MEDIUM] — Uploaded files served with `Cache-Control: public` — SOX documents cacheable without auth

- **File:** [app/api/uploads/[...path]/route.ts:31-34](app/api/uploads/%5B...path%5D/route.ts)
- **Risk:** The `Cache-Control: public, max-age=31536000` header instructs any intermediate proxy or CDN to cache uploaded PDFs and images for one year and serve them without re-validating authentication — if a caching layer (Cloudflare, Nginx proxy cache) is ever placed in front of Traefik, sensitive SOX audit documents become publicly cacheable.
- **Fix:** Replace the cache header with a private directive:
  ```ts
  return new NextResponse(file, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
    },
  });
  ```

---

### [MEDIUM] — Admin and audit-log routes trust middleware-set headers with no in-route session defense

- **File:** [app/api/admin/users/route.ts:7-12](app/api/admin/users/route.ts), [app/api/admin/users/[id]/route.ts:4-7](app/api/admin/users/%5Bid%5D/route.ts), [app/api/admin/users/[id]/companies/route.ts:4-9](app/api/admin/users/%5Bid%5D/companies/route.ts), [app/api/audit/route.ts:4-11](app/api/audit/route.ts)
- **Risk:** All four routes authorize solely via `req.headers.get("x-user-role")` set by the middleware; if the middleware has a configuration gap, a bug in its internal fetch to `/api/auth/me`, or is bypassed by direct container access (the Docker service binds on port 3000 on the internal network where other `n8n_default` services live), these routes have no independent verification of identity.
- **Fix:** Add `validateSession` calls inside each route handler as a second layer. The cost is one extra DB lookup per request on these sensitive paths, which is acceptable:
  ```ts
  // app/api/audit/route.ts
  export async function GET(req: NextRequest) {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await validateSession(token);
    if (!session || !["admin", "developer"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // ... existing logic using session.role instead of req.headers.get("x-user-role")
  }
  ```
  Apply the same pattern to the three admin user routes.

---

## Passed Checks

- **Redirect validation:** The only redirect using `req.url` as a base is in `app/api/auth/logout/route.ts` (line 11), which redirects to the hardcoded path `/login` — no user-supplied destination is used anywhere in `app/`.
- **console.log in production:** No `console.log` calls were found in `app/` or `components/`. Server-error catch blocks use `console.error` only, which does not log request data, credentials, or tokens.
- **Upload process and article route permissions:** `app/api/upload/process/route.ts` and `app/api/upload/article/route.ts` both validate the session cookie and restrict to `["editor", "admin", "developer"]` before forwarding to the pipeline.
- **Upload path traversal:** `app/api/uploads/[...path]/route.ts:15` correctly validates that the resolved path starts with `UPLOADS_DIR` before serving the file.
- **Workflow and SED DELETE permissions:** `app/api/workflows/[id]/route.ts` and `app/api/seds/[id]/route.ts` both call `validateSession` and enforce role restrictions (`["editor", "admin"]` and `["editor", "admin", "developer"]` respectively).
- **Admin user PATCH/DELETE self-deletion guard:** `app/api/admin/users/[id]/route.ts:54-57` correctly prevents an admin from deleting their own account.
- **pip: aiohttp, langchain-core, requests** — these packages have known CVEs but the pipeline does not expose them to untrusted HTTP input from the internet (only internal Docker network traffic reaches the pipeline); treat as medium-priority upgrades during the next maintenance window.
