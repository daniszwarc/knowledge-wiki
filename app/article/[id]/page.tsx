"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ChatPanel } from "@/components/ChatPanel";

interface Article {
  id: string;
  title: string;
  department: string | null;
  workflow_name: string | null;
  content: string;
  source_filename: string | null;
  source_url: string | null;
  created_at: string;
  created_by: string | null;
  stakeholder_validated: boolean;
  validated_by: string | null;
  validated_at: string | null;
  is_corporate: boolean;
  company_name: string | null;
  company_number: number | null;
}

function prepareContent(raw: string): string {
  // Strip wrapping code fences the LLM adds, e.g. ```markdown ... ```
  return raw.trim().replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function downloadMarkdown(content: string, title: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(title)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

const btnStyle: React.CSSProperties = {
  fontSize: 12, padding: "4px 12px", borderRadius: 6,
  border: "1px solid var(--card-border)", background: "none",
  color: "var(--muted)", cursor: "pointer", textDecoration: "none",
  display: "inline-block", lineHeight: "20px",
};

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [me, setMe] = useState<{ id: string; email: string; role: string } | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [validating, setValidating] = useState(false);
  const [validatorName, setValidatorName] = useState("");
  const [validating_loading, setValidatingLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [validatedBy, setValidatedBy] = useState<string | null>(null);
  const [validatedAt, setValidatedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setMe(data); });
  }, []);

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data: Article | null) => {
        if (data) {
          setArticle(data);
          setValidated(data.stakeholder_validated);
          setValidatedBy(data.validated_by);
          setValidatedAt(data.validated_at);
        }
        setLoading(false);
      });
  }, [id]);

  async function handleValidate() {
    const name = validatorName.trim();
    if (!name) return;
    setValidatingLoading(true);
    try {
      await fetch(`/api/articles/${id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validatedBy: name }),
      });
      setValidated(true);
      setValidatedBy(name);
      setValidatedAt(new Date().toISOString());
      setValidating(false);
      setValidatorName("");
    } finally {
      setValidatingLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await fetch(`/api/articles/${id}`, { method: "DELETE" });
      router.push("/");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--muted)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--muted)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        Article not found.
      </div>
    );
  }

  const canValidate = me && ["validator", "editor", "admin"].includes(me.role);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      <Sidebar activeArticleId={id} me={me} />

      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", borderRight: "1px solid var(--sidebar-border)" }}>

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid var(--sidebar-border)", padding: "12px 32px", display: "flex", alignItems: "center", gap: 10 }}>
        <a href="/" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
          <span>←</span> All workflows
        </a>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {article.source_url && (
            <a href={article.source_url} download={article.source_filename ?? true} style={btnStyle}>
              ↓ {article.source_filename ?? "Source document"}
            </a>
          )}
          <button type="button" onClick={() => downloadMarkdown(article.content, article.title)} style={btnStyle}>
            ↓ Markdown
          </button>
        </span>
      </div>

      {/* Article */}
      <div style={{ maxWidth: 720, width: "100%", padding: "48px 32px 80px", overflowWrap: "break-word", wordBreak: "break-word" }}>

        {/* Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {article.department && (
            <span style={{
              fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99,
              border: "1px solid var(--card-border)", background: "var(--sidebar-bg)", color: "var(--muted)",
            }}>
              {article.department}
            </span>
          )}
          {article.is_corporate && (
            <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: "#E6F1FB", color: "#185FA5", border: "1px solid #C0D7F3" }}>
              Corporate
            </span>
          )}
          {!article.is_corporate && article.company_name && (
            <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, border: "1px solid var(--card-border)", background: "var(--sidebar-bg)", color: "var(--muted)" }}>
              {article.company_number != null ? `${article.company_number} - ${article.company_name}` : article.company_name}
            </span>
          )}
          {validated && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
              background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0",
            }}>
              ✓ Validated
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.25, marginBottom: 16, letterSpacing: "-0.01em" }}>
          {article.title}
        </h1>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--muted-light)", marginBottom: 40, flexWrap: "wrap", paddingBottom: 20, borderBottom: "1px solid var(--card-border)" }}>
          <span>{new Date(article.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
          {article.workflow_name && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>Related workflow:</span>
              <a
                href={`/workflow/${encodeURIComponent(article.workflow_name)}`}
                style={{ color: "var(--muted)", fontWeight: 500, textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
              >
                {article.workflow_name}
              </a>
            </>
          )}
        </div>

        {/* Prose */}
        <div
          className="article-prose"
          style={{ lineHeight: 1.8, color: "var(--foreground)", fontSize: 15 }}
          dangerouslySetInnerHTML={{ __html: prepareContent(article.content) }}
        />

        {/* Validation */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--card-border)" }}>
          {validated ? (
            <p style={{ fontSize: 12, color: "#15803d" }}>
              Validated by <strong>{validatedBy}</strong>
              {validatedAt && ` on ${new Date(validatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`}
            </p>
          ) : canValidate ? (
            <div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                This article has not been validated yet.
              </p>
              {validating ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    autoFocus
                    className="search-input"
                    value={validatorName}
                    onChange={(e) => setValidatorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleValidate();
                      if (e.key === "Escape") { setValidating(false); setValidatorName(""); }
                    }}
                    placeholder="Your name"
                    style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, width: 160 }}
                  />
                  <button
                    onClick={handleValidate}
                    disabled={!validatorName.trim() || validating_loading}
                    style={{
                      fontSize: 12, padding: "5px 14px", borderRadius: 6,
                      border: "1px solid #86efac", background: "#f0fdf4", color: "#15803d",
                      cursor: validatorName.trim() ? "pointer" : "not-allowed",
                      opacity: validatorName.trim() ? 1 : 0.5,
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => { setValidating(false); setValidatorName(""); }}
                    style={{ fontSize: 12, padding: "5px 8px", borderRadius: 6, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setValidating(true)}
                  style={{
                    fontSize: 12, padding: "5px 14px", borderRadius: 6,
                    border: "1px solid #86efac", background: "#f0fdf4", color: "#15803d",
                    cursor: "pointer", fontWeight: 500,
                  }}
                >
                  Mark as validated
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Delete */}
        {me && ["validator", "editor", "admin"].includes(me.role) && (
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--card-border)" }}>
            {confirmingDelete ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Are you sure? This cannot be undone.</span>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  style={{
                    fontSize: 12, padding: "5px 14px", borderRadius: 6,
                    border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
                    cursor: deleteLoading ? "not-allowed" : "pointer", fontWeight: 500,
                    opacity: deleteLoading ? 0.6 : 1,
                  }}
                >
                  {deleteLoading ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                style={{
                  fontSize: 12, padding: "5px 14px", borderRadius: 6,
                  border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
                  cursor: "pointer",
                }}
              >
                Delete article
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .article-prose h2 { font-size: 20px; font-weight: 600; margin-top: 32px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--card-border); color: var(--foreground); }
        .article-prose h3 { font-size: 16px; font-weight: 600; margin-top: 24px; margin-bottom: 8px; color: var(--foreground); }
        .article-prose p { line-height: 1.8; margin-bottom: 16px; color: var(--foreground); font-size: 15px; }
        .article-prose ol { margin-left: 24px; margin-bottom: 16px; list-style-type: decimal; }
        .article-prose ul { margin-left: 24px; margin-bottom: 16px; list-style-type: disc; }
        .article-prose li { margin-bottom: 6px; color: var(--foreground); font-size: 15px; line-height: 1.8; }
        .article-prose table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .article-prose th { background: var(--sidebar-bg); padding: 8px 12px; text-align: left; font-weight: 600; font-size: 13px; border-bottom: 1px solid var(--card-border); }
        .article-prose td { padding: 8px 12px; border-bottom: 1px solid var(--card-border); font-size: 13px; font-weight: 400; color: var(--foreground); }
        .article-prose figure { margin: 24px 0; }
        .article-prose img { max-width: 100%; border-radius: 8px; border: 1px solid var(--card-border); cursor: pointer; }
      `}</style>
      </main>

      <ChatPanel
        context={article.content}
        title="Ask about this article"
        subtitle="Answers are grounded in this document."
      />
    </div>
  );
}
