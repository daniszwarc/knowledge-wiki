"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {article.department && (
            <span style={{
              fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99,
              border: "1px solid var(--card-border)", background: "var(--sidebar-bg)", color: "var(--muted)",
            }}>
              {article.department}
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
        <div>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 12, color: "var(--foreground)", lineHeight: 1.3 }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--card-border)", color: "var(--foreground)", lineHeight: 1.35 }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 8, color: "var(--foreground)", lineHeight: 1.4 }}>{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 style={{ fontSize: 14, fontWeight: 600, marginTop: 20, marginBottom: 6, color: "var(--foreground)" }}>{children}</h4>
              ),
              p: ({ children }) => (
                <p style={{ lineHeight: 1.8, marginBottom: 16, color: "var(--foreground)", fontSize: 15 }}>{children}</p>
              ),
              ul: ({ children }) => (
                <ul style={{ marginLeft: 24, marginBottom: 16, lineHeight: 1.8, listStyleType: "disc" }}>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol style={{ marginLeft: 24, marginBottom: 16, lineHeight: 1.8, listStyleType: "decimal" }}>{children}</ol>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: 6, color: "var(--foreground)", fontSize: 15 }}>{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{ borderLeft: "3px solid var(--card-border)", paddingLeft: 16, marginLeft: 0, marginBottom: 16, color: "var(--muted)", fontStyle: "italic" }}>{children}</blockquote>
              ),
              hr: () => (
                <hr style={{ border: "none", borderTop: "1px solid var(--card-border)", margin: "24px 0" }} />
              ),
              strong: ({ children }) => (
                <strong style={{ fontWeight: 600 }}>{children}</strong>
              ),
              em: ({ children }) => (
                <em style={{ fontStyle: "italic" }}>{children}</em>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  style={{ color: "var(--accent, #2563eb)", textDecoration: "underline", textUnderlineOffset: 2 }}
                  target={href?.startsWith("http") ? "_blank" : undefined}
                  rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {children}
                </a>
              ),
              img: ({ src, alt }) => (
                <span style={{ display: "block", margin: "16px 0" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={alt ?? ""}
                    style={{
                      maxWidth: "100%",
                      border: "1px solid var(--card-border)",
                      borderRadius: 8,
                      display: "block",
                      cursor: "pointer",
                    }}
                    onClick={() => src && window.open(src, "_blank")}
                  />
                  {alt && (
                    <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>{alt}</span>
                  )}
                </span>
              ),
              table: ({ children }) => (
                <div style={{ overflowX: "auto", marginBottom: 20 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead>{children}</thead>,
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => <tr>{children}</tr>,
              th: ({ children }) => (
                <th style={{ background: "var(--sidebar-bg)", padding: "8px 12px", textAlign: "left", fontWeight: 600, fontSize: 13, borderBottom: "1px solid var(--card-border)" }}>{children}</th>
              ),
              td: ({ children }) => (
                <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--card-border)", fontSize: 14, color: "var(--foreground)" }}>{children}</td>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.startsWith("language-");
                if (isBlock) return <code style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13 }}>{children}</code>;
                return <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, fontSize: 13, fontFamily: "var(--font-geist-mono, monospace)" }}>{children}</code>;
              },
              pre: ({ children }) => (
                <pre style={{ background: "#f3f4f6", padding: 16, borderRadius: 8, overflowX: "auto", marginBottom: 16, fontSize: 13, fontFamily: "var(--font-geist-mono, monospace)", lineHeight: 1.6 }}>{children}</pre>
              ),
            }}
          >
            {prepareContent(article.content)}
          </ReactMarkdown>
        </div>

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

      </main>

      <ChatPanel
        context={article.content}
        title="Ask about this article"
        subtitle="Answers are grounded in this document."
      />
    </div>
  );
}
