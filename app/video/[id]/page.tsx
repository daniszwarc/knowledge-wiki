"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

interface Video {
  id: string;
  title: string;
  department: string;
  embed_url: string;
  content: string | null;
  overview: string | null;
  toc: { title: string; timestamp: string; seconds: number }[] | null;
  is_corporate: boolean;
  validated_by: string | null;
  validated_at: string | null;
  created_by: string;
  created_at: string;
}

function execCmd(cmd: string, editorRef: React.RefObject<HTMLDivElement | null>, value?: string) {
  editorRef.current?.focus();
  document.execCommand(cmd, false, value);
}

export default function VideoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [me, setMe] = useState<{ id: string; email: string; role: string } | null>(null);

  const [validating, setValidating] = useState(false);
  const [validatorName, setValidatorName] = useState("");
  const [validatingLoading, setValidatingLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [validatedBy, setValidatedBy] = useState<string | null>(null);
  const [validatedAt, setValidatedAt] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setMe(data); });
  }, []);

  useEffect(() => {
    fetch(`/api/videos/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data: Video | null) => {
        if (data) {
          setVideo(data);
          setValidated(!!data.validated_by);
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
      await fetch(`/api/videos/${id}/validate`, {
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

  function startEditing() {
    setEditing(true);
    setSaveError("");
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = video?.content ?? "";
        editorRef.current.focus();
      }
    }, 0);
  }

  function cancelEditing() {
    if (editorRef.current) {
      editorRef.current.innerHTML = video?.content ?? "";
    }
    setEditing(false);
    setSaveError("");
  }

  async function saveContent() {
    if (!editorRef.current) return;
    const innerHTML = editorRef.current.innerHTML;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: innerHTML }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError((err as { error?: string }).error ?? "Save failed");
        return;
      }
      setVideo((prev) => prev ? { ...prev, content: innerHTML } : prev);
      setEditing(false);
    } catch {
      setSaveError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--muted)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (notFound || !video) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--muted)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        Video not found.
      </div>
    );
  }

  const canValidate = me && ["validator", "editor", "admin", "developer"].includes(me.role);
  const canEdit = me && ["admin", "developer"].includes(me.role);
  const canDelete = me && ["editor", "admin", "developer"].includes(me.role);

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/videos/${id}`, { method: "DELETE" });
      router.push("/");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      <Sidebar activeVideoId={id} me={me} />

      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", borderRight: "1px solid var(--sidebar-border)" }}>

        {/* Top bar */}
        <div style={{ borderBottom: "1px solid var(--sidebar-border)", padding: "12px 32px", display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
            <span>←</span> Home
          </a>
        </div>

        <div style={{ maxWidth: video.toc && video.toc.length >= 5 ? 1100 : 720, width: "100%", padding: "48px 32px 80px" }}>

          {/* Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99,
              border: "1px solid var(--card-border)", background: "var(--sidebar-bg)", color: "var(--muted)",
            }}>
              {video.department}
            </span>
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
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.25, marginBottom: 24, letterSpacing: "-0.01em" }}>
            {video.title}
          </h1>

          {/* Overview card */}
          {video.overview && (
            <div style={{ background: "#EEF2FB", border: "1px solid #B5D4F4", borderRadius: 10, padding: "16px 20px", marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#4A72A8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Overview
              </div>
              <p style={{ fontSize: 14, color: "#1A3860", lineHeight: 1.7, margin: 0 }}>{video.overview}</p>
            </div>
          )}

          {/* Two-column layout when TOC has 5+ items */}
          <div style={{ display: "grid", gridTemplateColumns: video.toc && video.toc.length >= 5 ? "1fr 300px" : "1fr", gap: 32, alignItems: "start" }}>

            {/* Left column: player + guide */}
            <div>
              {/* Embed player */}
              <div style={{ marginBottom: 28 }}>
                <iframe
                  src={video.embed_url}
                  width="100%"
                  height="450"
                  allowFullScreen
                  style={{ display: "block", borderRadius: 8, border: "none" }}
                />
                <p style={{ fontSize: 12, color: "var(--muted-foreground, #8A8F98)", marginTop: 6, marginBottom: 0 }}>
                  If the video does not load, make sure you are logged into your Microsoft account in another browser tab, then refresh this page.
                </p>
              </div>

              {/* Step-by-step guide heading + controls */}
              {video.content && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Step-by-step guide</h2>
                    {canEdit && !editing && (
                      <button
                        onClick={startEditing}
                        style={{
                          fontSize: 12, padding: "4px 12px", borderRadius: 6,
                          border: "1px solid var(--card-border)", background: "var(--sidebar-bg)",
                          color: "var(--foreground)", cursor: "pointer",
                        }}
                      >
                        Edit guide
                      </button>
                    )}
                    {canEdit && editing && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {saveError && <span style={{ fontSize: 12, color: "#dc2626" }}>{saveError}</span>}
                        <button
                          onClick={saveContent}
                          disabled={saving}
                          style={{
                            fontSize: 12, padding: "4px 12px", borderRadius: 6,
                            border: "1px solid #86efac", background: "#f0fdf4", color: "#15803d",
                            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
                          }}
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={saving}
                          style={{
                            fontSize: 12, padding: "4px 10px", borderRadius: 6,
                            border: "1px solid var(--card-border)", background: "none",
                            color: "var(--muted)", cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Toolbar */}
                  {editing && (
                    <div style={{
                      display: "flex", gap: 4, flexWrap: "wrap",
                      background: "var(--card-bg)", border: "1px solid var(--card-border)",
                      borderRadius: "8px 8px 0 0", padding: "6px 10px",
                      borderBottom: "1px solid var(--card-border)",
                    }}>
                      {[
                        { label: "H2", action: () => document.execCommand("formatBlock", false, "h2") },
                        { label: "Bold", action: () => execCmd("bold", editorRef) },
                        { label: "Italic", action: () => execCmd("italic", editorRef) },
                        { label: "¶", title: "Paragraph", action: () => document.execCommand("formatBlock", false, "p") },
                        { label: "↩ Undo", action: () => execCmd("undo", editorRef) },
                        { label: "↪ Redo", action: () => execCmd("redo", editorRef) },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          title={btn.title ?? btn.label}
                          onMouseDown={(e) => { e.preventDefault(); btn.action(); }}
                          style={{
                            fontSize: 11, fontWeight: 500,
                            padding: "3px 8px", borderRadius: 4,
                            border: "1px solid var(--card-border)",
                            background: "var(--sidebar-bg)", color: "var(--foreground)",
                            cursor: "pointer", lineHeight: 1.4,
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Content area */}
                  <div
                    ref={editorRef}
                    contentEditable={editing}
                    suppressContentEditableWarning
                    className="article-prose"
                    style={{
                      lineHeight: 1.8,
                      color: "var(--foreground)",
                      fontSize: 15,
                      marginBottom: 32,
                      outline: editing ? "2px solid var(--card-border)" : "none",
                      borderRadius: editing ? "0 0 8px 8px" : 0,
                      padding: editing ? "12px 16px" : 0,
                      minHeight: editing ? 200 : "auto",
                    }}
                    dangerouslySetInnerHTML={editing ? undefined : { __html: video.content ?? "" }}
                  />
                </div>
              )}
            </div>

            {/* Right column: TOC */}
            {video.toc && video.toc.length >= 5 && (
              <div style={{ border: "1px solid var(--card-border)", borderRadius: 10, padding: "16px 20px", background: "var(--sidebar-bg)" }}>
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Contents</h2>
                <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {video.toc.map((item, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--card-border)" }}>
                      <span style={{ fontSize: 11, color: "var(--muted-light)", minWidth: 16, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontSize: 12, color: "var(--foreground)", flex: 1, lineHeight: 1.4 }}>{item.title}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)", fontFeatureSettings: '"tnum"', flexShrink: 0 }}>{item.timestamp}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

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
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>This video has not been validated yet.</p>
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
                      disabled={!validatorName.trim() || validatingLoading}
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
          {canDelete && (
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--card-border)" }}>
              {deleteConfirm ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>Are you sure you want to delete this video? This cannot be undone.</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      fontSize: 12, padding: "5px 14px", borderRadius: 6,
                      border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
                      cursor: deleting ? "not-allowed" : "pointer", fontWeight: 500,
                      opacity: deleting ? 0.6 : 1,
                    }}
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  style={{
                    fontSize: 12, padding: "5px 14px", borderRadius: 6,
                    border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
                    cursor: "pointer",
                  }}
                >
                  Delete video
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
        `}</style>
      </main>
    </div>
  );
}
