"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";

interface Workflow {
  id: string;
  name: string;
  department: string;
  description: string;
  completeness_score: number;
  rule_count: string;
  validated_count: string;
  gap_count: string;
}

interface GroupedWorkflows {
  [department: string]: Workflow[];
}

interface NavArticle {
  id: string;
  title: string;
  stakeholder_validated: boolean;
}

interface NavDept {
  department: string;
  workflows: Workflow[];
  articles: NavArticle[];
}

const DEPT_ICONS: Record<string, string> = {
  Finance: "₣",
  Operations: "⚙",
  IT: "⌨",
};

function completenessLevel(score: number): "high" | "medium" | "low" {
  if (score >= 80) return "high";
  if (score >= 55) return "medium";
  return "low";
}

export default function HomePage() {
  const [grouped, setGrouped] = useState<GroupedWorkflows>({});
  const [departments, setDepartments] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Nav data (includes articles per dept)
  const [navData, setNavData] = useState<NavDept[]>([]);

  // Workflow delete state
  const [confirmingDeleteWorkflow, setConfirmingDeleteWorkflow] = useState<string | null>(null);

  // Upload state
  const [mainTab, setMainTab] = useState<"process" | "article">("process");
  const [uploadTab, setUploadTab] = useState<"file" | "text">("file");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadWorkflow, setUploadWorkflow] = useState("");
  const [uploadDept, setUploadDept] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadResult, setUploadResult] = useState<{ rules_extracted: number; rules_written: number } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadDragging, setUploadDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Current user
  const [me, setMe] = useState<{ id: string; email: string; role: string } | null>(null);

  // Paste text state
  const [pasteText, setPasteText] = useState("");
  const [pasteWorkflow, setPasteWorkflow] = useState("");
  const [pasteDept, setPasteDept] = useState("");
  const [pasteOwnerName, setPasteOwnerName] = useState("");
  const [pasteOwnerEmail, setPasteOwnerEmail] = useState("");
  const [pasteSource, setPasteSource] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteResult, setPasteResult] = useState<{ rules_extracted: number; rules_written: number } | null>(null);
  const [pasteError, setPasteError] = useState("");

  // Article upload state
  const [articleFile, setArticleFile] = useState<File | null>(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleDept, setArticleDept] = useState("");
  const [articleWorkflow, setArticleWorkflow] = useState("");
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleProgress, setArticleProgress] = useState(0);
  const [articleStage, setArticleStage] = useState("");
  const [articleResult, setArticleResult] = useState<{ article_id: string; title: string } | null>(null);
  const [articleError, setArticleError] = useState("");
  const [articleDragging, setArticleDragging] = useState(false);
  const articleFileInputRef = useRef<HTMLInputElement>(null);
  const articleTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setMe(data); });
  }, []);

  useEffect(() => {
    fetch("/api/nav")
      .then((r) => r.json())
      .then((data: NavDept[]) => { if (Array.isArray(data)) setNavData(data); });
  }, []);

  useEffect(() => {
    fetch("/api/workflows")
      .then((r) => r.json())
      .then((data: Workflow[]) => {
        const g: GroupedWorkflows = {};
        for (const w of data) {
          if (!g[w.department]) g[w.department] = [];
          g[w.department].push(w);
        }
        setGrouped(g);
        const depts = Object.keys(g).sort();
        setDepartments(depts);
        const open: Record<string, boolean> = {};
        depts.forEach((d) => (open[d] = false));
        setOpenDepts(open);
      });
  }, []);

  async function handleChat(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const q = chatInput.trim();
    setChatInput("");
    setChatResponse("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: q }] }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setChatResponse((prev) => prev + decoder.decode(value));
      }
    } finally {
      setChatLoading(false);
    }
  }

  function refreshWorkflows() {
    fetch("/api/workflows")
      .then((r) => r.json())
      .then((data: Workflow[]) => {
        const g: GroupedWorkflows = {};
        for (const w of data) {
          if (!g[w.department]) g[w.department] = [];
          g[w.department].push(w);
        }
        setGrouped(g);
        const depts = Object.keys(g).sort();
        setDepartments(depts);
        setOpenDepts((prev) => {
          const next = { ...prev };
          depts.forEach((d) => { if (!(d in next)) next[d] = false; });
          return next;
        });
      });
  }

  async function handleUpload(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!uploadFile || !uploadWorkflow.trim() || !uploadDept.trim() || uploadLoading) return;
    setUploadLoading(true);
    setUploadResult(null);
    setUploadError("");
    setUploadProgress(0);

    // Simulated progress stages: upload → extracting → writing
    const stages: [number, number, string][] = [
      [400,  15, "Uploading file…"],
      [1200, 35, "Extracting rules with AI…"],
      [5000, 60, "Extracting rules with AI…"],
      [12000, 80, "Almost done…"],
    ];
    uploadTimersRef.current.forEach(clearTimeout);
    uploadTimersRef.current = stages.map(([delay, pct, label]) =>
      setTimeout(() => { setUploadProgress(pct); setUploadStage(label); }, delay)
    );

    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("workflow_name", uploadWorkflow.trim());
      fd.append("department", uploadDept.trim());
      const res = await fetch("http://localhost:8000/ingest", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Upload failed");
      }
      const json = await res.json();
      uploadTimersRef.current.forEach(clearTimeout);
      setUploadProgress(100);
      setUploadStage("Done");
      setUploadResult({ rules_extracted: json.rules_extracted, rules_written: json.rules_written });
      setUploadFile(null);
      setUploadWorkflow("");
      setUploadDept("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      refreshWorkflows();
    } catch (err) {
      uploadTimersRef.current.forEach(clearTimeout);
      setUploadProgress(0);
      setUploadStage("");
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handlePaste(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!pasteText.trim() || !pasteWorkflow.trim() || !pasteDept.trim() || pasteLoading) return;
    setPasteLoading(true);
    setPasteResult(null);
    setPasteError("");
    try {
      const res = await fetch("http://localhost:8000/ingest/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pasteText.trim(),
          workflow_name: pasteWorkflow.trim(),
          department: pasteDept.trim(),
          ...(pasteOwnerName.trim() && { owner_name: pasteOwnerName.trim() }),
          ...(pasteOwnerEmail.trim() && { owner_email: pasteOwnerEmail.trim() }),
          ...(pasteSource.trim() && { source: pasteSource.trim() }),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Submission failed");
      }
      const json = await res.json();
      setPasteResult({ rules_extracted: json.rules_extracted, rules_written: json.rules_written });
      setPasteText("");
      setPasteWorkflow("");
      setPasteDept("");
      setPasteOwnerName("");
      setPasteOwnerEmail("");
      setPasteSource("");
      refreshWorkflows();
    } catch (err) {
      setPasteError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setPasteLoading(false);
    }
  }

  async function handleDeleteWorkflow(workflowId: string) {
    await fetch(`/api/workflows/${workflowId}`, { method: "DELETE" });
    setConfirmingDeleteWorkflow(null);
    setGrouped((prev) => {
      const next: GroupedWorkflows = {};
      for (const dept of Object.keys(prev)) {
        next[dept] = prev[dept].filter((w) => w.id !== workflowId);
      }
      return next;
    });
  }

  function refreshNav() {
    fetch("/api/nav")
      .then((r) => r.json())
      .then((data: NavDept[]) => { if (Array.isArray(data)) setNavData(data); });
  }

  async function handleArticleUpload(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!articleFile || !articleTitle.trim() || !articleDept.trim() || articleLoading) return;
    setArticleLoading(true);
    setArticleResult(null);
    setArticleError("");
    setArticleProgress(0);

    const stages: [number, number, string][] = [
      [400,  20, "Converting document to article…"],
      [2000, 45, "Converting document to article…"],
      [6000, 70, "Almost done…"],
    ];
    articleTimersRef.current.forEach(clearTimeout);
    articleTimersRef.current = stages.map(([delay, pct, label]) =>
      setTimeout(() => { setArticleProgress(pct); setArticleStage(label); }, delay)
    );

    try {
      const fd = new FormData();
      fd.append("file", articleFile);
      fd.append("title", articleTitle.trim());
      fd.append("department", articleDept.trim());
      if (articleWorkflow.trim()) fd.append("workflow_name", articleWorkflow.trim());
      const res = await fetch("http://localhost:8000/ingest/article", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Upload failed");
      }
      const json = await res.json();
      articleTimersRef.current.forEach(clearTimeout);
      setArticleProgress(100);
      setArticleStage("Done");
      setArticleResult({ article_id: json.article_id, title: json.title });
      setArticleFile(null);
      setArticleTitle("");
      setArticleDept("");
      setArticleWorkflow("");
      if (articleFileInputRef.current) articleFileInputRef.current.value = "";
      refreshNav();
    } catch (err) {
      articleTimersRef.current.forEach(clearTimeout);
      setArticleProgress(0);
      setArticleStage("");
      setArticleError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setArticleLoading(false);
    }
  }

  function scrollToSection(dept: string) {
    sectionRefs.current[dept]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleDept(dept: string) {
    setOpenDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="sidebar" style={{ width: 256, flexShrink: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>

        {/* Brand */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--sidebar-border)" }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "var(--muted)" }}>
            APi GROUP - Knowledge Wiki
          </span>
        </div>

        {/* Department nav */}
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {navData.map((deptData) => {
            const dept = deptData.department;
            const deptArticles = deptData.articles;
            return (
              <div key={dept}>
                <button
                  onClick={() => toggleDept(dept)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  <span style={{ fontSize: 13, opacity: 0.7, width: 16, textAlign: "center", flexShrink: 0 }}>{DEPT_ICONS[dept] ?? "◈"}</span>
                  <span>{dept}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 400, color: "var(--muted-light)" }}>
                    {grouped[dept]?.length ?? 0}
                  </span>
                  <ChevronIcon rotated={openDepts[dept]} />
                </button>

                {openDepts[dept] && (
                  <div style={{ marginLeft: 40, paddingLeft: 8, borderLeft: "1px solid var(--card-border)", marginBottom: 4 }}>
                    {grouped[dept]?.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => scrollToSection(dept)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "6px 8px",
                          fontSize: 12,
                          color: "var(--muted)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          borderRadius: 6,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-hover-bg)"; e.currentTarget.style.color = "var(--foreground)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted)"; }}
                      >
                        {w.name}
                      </button>
                    ))}
                    {deptArticles.length > 0 && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-light)", padding: "6px 8px 2px", opacity: 0.7 }}>
                          Articles
                        </div>
                        {deptArticles.map((a) => (
                          <a
                            key={a.id}
                            href={`/article/${a.id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 8px",
                              fontSize: 12,
                              color: "var(--muted)",
                              textDecoration: "none",
                              borderRadius: 6,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-hover-bg)"; e.currentTarget.style.color = "var(--foreground)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--muted)"; }}
                          >
                            <span style={{
                              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                              background: a.stakeholder_validated ? "#4ade80" : "#f59e0b",
                              opacity: a.stakeholder_validated ? 0.8 : 0.5,
                            }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {a.title}
                            </span>
                          </a>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "10px 14px 80px", borderTop: "1px solid var(--sidebar-border)" }}>
          <a href="/experts" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
            Subject matter experts
          </a>
          <a href="/validate" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
            Validation review
          </a>
          <a href="/gaps" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
            Flagged gaps
          </a>
          {me?.role === "admin" && (
            <a href="/admin/users" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
              Admin
            </a>
          )}
          {me && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--sidebar-border)" }}>
              <p style={{ fontSize: 11, color: "var(--muted-light)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {me.email}
              </p>
              <p style={{ fontSize: 10, color: "var(--muted-light)", opacity: 0.7, marginBottom: 6, textTransform: "capitalize" }}>
                {me.role}
              </p>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* Content */}
        <div style={{ padding: "32px 32px 64px", maxWidth: 960, width: "100%" }}>

          {/* Hero */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--foreground)", marginBottom: 8, lineHeight: 1.3 }}>
              How do our business processes work?
            </h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, maxWidth: 520 }}>
              Documented rules, controls, and procedures across Finance, Operations, and IT.
              Every rule is traceable to a source and an owner.
            </p>
          </div>

          {/* AI guided finder */}
          <div style={{
            marginBottom: 40,
            padding: 20,
            borderRadius: 12,
            border: "1px solid var(--card-border)",
            background: "var(--sidebar-bg)",
          }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", marginBottom: 12 }}>
              Help me find a process
            </p>
            <form onSubmit={handleChat} style={{ display: "flex", gap: 8 }}>
              <input
                className="search-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="e.g. How do we handle a vendor invoice dispute?"
                style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: "none",
                  background: "var(--foreground)",
                  color: "var(--background)",
                  cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                  opacity: chatLoading || !chatInput.trim() ? 0.45 : 1,
                  flexShrink: 0,
                }}
              >
                {chatLoading ? "…" : "Ask"}
              </button>
            </form>
            {chatResponse && (
              <div style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid var(--card-border)",
              }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => setChatResponse("")}
                    style={{
                      fontSize: 11,
                      color: "var(--muted-light)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 4px",
                    }}
                  >
                    Clear
                  </button>
                </div>
                <div style={{
                  fontSize: 13,
                  color: "var(--foreground)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}>
                  {chatResponse}
                </div>
              </div>
            )}
          </div>

          {/* Document upload — visible to validator / editor / admin only */}
          {me && ["validator", "editor", "admin"].includes(me.role) && (
            <div style={{
              marginBottom: 40,
              padding: 20,
              borderRadius: 12,
              border: "1px solid var(--card-border)",
              background: "var(--sidebar-bg)",
            }}>
              {/* Main tab switcher */}
              <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                {(["process", "article"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setMainTab(tab)}
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: `1px solid ${mainTab === tab ? "var(--foreground)" : "var(--card-border)"}`,
                      cursor: "pointer",
                      background: mainTab === tab ? "var(--foreground)" : "transparent",
                      color: mainTab === tab ? "var(--background)" : "var(--muted)",
                      textAlign: "center",
                    }}
                  >
                    {tab === "process" ? "Upload process document" : "Add reference article"}
                  </button>
                ))}
              </div>

              {mainTab === "process" ? (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
                    Extract business rules from a document or email
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                    Upload a PDF, Word document, or paste text from an email. The system will automatically extract business rules and add them to the knowledge base.
                  </p>

                  {/* Process sub-toggle: file vs paste */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                    {(["file", "text"] as const).map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setUploadTab(sub)}
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid var(--card-border)",
                          cursor: "pointer",
                          background: uploadTab === sub ? "var(--card-hover-bg)" : "transparent",
                          color: uploadTab === sub ? "var(--foreground)" : "var(--muted)",
                        }}
                      >
                        {sub === "file" ? "Upload file" : "Paste text"}
                      </button>
                    ))}
                  </div>

                  {uploadTab === "file" ? (
                    <form onSubmit={handleUpload}>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setUploadDragging(true); }}
                        onDragLeave={() => setUploadDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setUploadDragging(false);
                          const f = e.dataTransfer.files[0];
                          if (f) setUploadFile(f);
                        }}
                        style={{
                          border: `1px dashed ${uploadDragging ? "var(--foreground)" : "var(--card-border)"}`,
                          borderRadius: 8,
                          padding: "18px 14px",
                          textAlign: "center",
                          cursor: "pointer",
                          marginBottom: 10,
                          background: uploadDragging ? "var(--card-hover-bg)" : "transparent",
                          transition: "background 0.15s, border-color 0.15s",
                        }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.txt"
                          style={{ display: "none" }}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadFile(f); }}
                        />
                        <span style={{ fontSize: 13, color: uploadFile ? "var(--foreground)" : "var(--muted-light)" }}>
                          {uploadFile ? uploadFile.name : "Drop a PDF, DOCX, or TXT file here, or click to browse"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <input
                          className="search-input"
                          value={uploadWorkflow}
                          onChange={(e) => setUploadWorkflow(e.target.value)}
                          placeholder="Workflow name"
                          style={{ flex: 2, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                        />
                        <input
                          className="search-input"
                          value={uploadDept}
                          onChange={(e) => setUploadDept(e.target.value)}
                          placeholder="Department"
                          style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                        <button
                          type="submit"
                          disabled={uploadLoading || !uploadFile || !uploadWorkflow.trim() || !uploadDept.trim()}
                          style={{
                            padding: "9px 18px", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none",
                            background: "var(--foreground)", color: "var(--background)",
                            cursor: uploadLoading || !uploadFile || !uploadWorkflow.trim() || !uploadDept.trim() ? "not-allowed" : "pointer",
                            opacity: uploadLoading || !uploadFile || !uploadWorkflow.trim() || !uploadDept.trim() ? 0.45 : 1,
                          }}
                        >
                          {uploadLoading ? "Extracting rules…" : "Extract rules"}
                        </button>
                      </div>
                      {uploadLoading && (
                        <div style={{ marginTop: 4, marginBottom: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: 12, color: "var(--muted)" }}>{uploadStage}</span>
                            <span style={{ fontSize: 12, color: "var(--muted-light)" }}>{uploadProgress}%</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 99, background: "var(--card-border)", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 99, background: "var(--foreground)", width: `${uploadProgress}%`, transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                      )}
                      {uploadResult && (
                        <div style={{ fontSize: 13, color: "#15803d", paddingTop: 4 }}>
                          Done — {uploadResult.rules_extracted} rule{uploadResult.rules_extracted !== 1 ? "s" : ""} extracted, {uploadResult.rules_written} written to the wiki.
                        </div>
                      )}
                      {uploadError && (
                        <div style={{ fontSize: 13, color: "#b91c1c", paddingTop: 4 }}>{uploadError}</div>
                      )}
                    </form>
                  ) : (
                    <form onSubmit={handlePaste}>
                      <textarea
                        className="search-input"
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder="Paste email content, meeting notes, or any text..."
                        rows={6}
                        style={{ width: "100%", padding: "9px 14px", fontSize: 13, borderRadius: 8, resize: "vertical", marginBottom: 10, fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <input
                          className="search-input"
                          value={pasteWorkflow}
                          onChange={(e) => setPasteWorkflow(e.target.value)}
                          placeholder="Workflow name"
                          style={{ flex: 2, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                        />
                        <input
                          className="search-input"
                          value={pasteDept}
                          onChange={(e) => setPasteDept(e.target.value)}
                          placeholder="Department"
                          style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <input
                          className="search-input"
                          value={pasteOwnerName}
                          onChange={(e) => setPasteOwnerName(e.target.value)}
                          placeholder="Owner name (optional)"
                          style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                        />
                        <input
                          className="search-input"
                          value={pasteOwnerEmail}
                          onChange={(e) => setPasteOwnerEmail(e.target.value)}
                          placeholder="Owner email (optional)"
                          style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <input
                          className="search-input"
                          value={pasteSource}
                          onChange={(e) => setPasteSource(e.target.value)}
                          placeholder="e.g. Email from Linda Chen, March 2026 (optional)"
                          style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                        />
                        <button
                          type="submit"
                          disabled={pasteLoading || !pasteText.trim() || !pasteWorkflow.trim() || !pasteDept.trim()}
                          style={{
                            padding: "9px 18px", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none",
                            background: "var(--foreground)", color: "var(--background)",
                            cursor: pasteLoading || !pasteText.trim() || !pasteWorkflow.trim() || !pasteDept.trim() ? "not-allowed" : "pointer",
                            opacity: pasteLoading || !pasteText.trim() || !pasteWorkflow.trim() || !pasteDept.trim() ? 0.45 : 1,
                            flexShrink: 0, whiteSpace: "nowrap",
                          }}
                        >
                          {pasteLoading ? "Extracting rules…" : "Extract rules"}
                        </button>
                      </div>
                      {pasteResult && (
                        <div style={{ fontSize: 13, color: "#15803d", paddingTop: 4 }}>
                          Done — {pasteResult.rules_extracted} rule{pasteResult.rules_extracted !== 1 ? "s" : ""} extracted, {pasteResult.rules_written} written to the wiki.
                        </div>
                      )}
                      {pasteError && (
                        <div style={{ fontSize: 13, color: "#b91c1c", paddingTop: 4 }}>{pasteError}</div>
                      )}
                    </form>
                  )}
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
                    Publish a reference document to the wiki
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                    Upload a technical guide, architecture document, or process overview. It will be stored as a searchable article and linked to a workflow if specified.
                  </p>
                  <form onSubmit={handleArticleUpload}>
                    <div
                      onClick={() => articleFileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setArticleDragging(true); }}
                      onDragLeave={() => setArticleDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setArticleDragging(false);
                        const f = e.dataTransfer.files[0];
                        if (f) setArticleFile(f);
                      }}
                      style={{
                        border: `1px dashed ${articleDragging ? "var(--foreground)" : "var(--card-border)"}`,
                        borderRadius: 8,
                        padding: "18px 14px",
                        textAlign: "center",
                        cursor: "pointer",
                        marginBottom: 10,
                        background: articleDragging ? "var(--card-hover-bg)" : "transparent",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                    >
                      <input
                        ref={articleFileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt,.md"
                        style={{ display: "none" }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setArticleFile(f); }}
                      />
                      <span style={{ fontSize: 13, color: articleFile ? "var(--foreground)" : "var(--muted-light)" }}>
                        {articleFile ? articleFile.name : "Drop a PDF, DOCX, TXT, or MD file here, or click to browse"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <input
                        className="search-input"
                        value={articleTitle}
                        onChange={(e) => setArticleTitle(e.target.value)}
                        placeholder="Article title"
                        style={{ flex: 2, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                      />
                      <input
                        className="search-input"
                        value={articleDept}
                        onChange={(e) => setArticleDept(e.target.value)}
                        placeholder="Department"
                        style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <input
                        className="search-input"
                        value={articleWorkflow}
                        onChange={(e) => setArticleWorkflow(e.target.value)}
                        placeholder="Related workflow (optional)"
                        style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                      />
                      <button
                        type="submit"
                        disabled={articleLoading || !articleFile || !articleTitle.trim() || !articleDept.trim()}
                        style={{
                          padding: "9px 18px", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none",
                          background: "var(--foreground)", color: "var(--background)",
                          cursor: articleLoading || !articleFile || !articleTitle.trim() || !articleDept.trim() ? "not-allowed" : "pointer",
                          opacity: articleLoading || !articleFile || !articleTitle.trim() || !articleDept.trim() ? 0.45 : 1,
                          flexShrink: 0, whiteSpace: "nowrap",
                        }}
                      >
                        {articleLoading ? "Publishing…" : "Publish article"}
                      </button>
                    </div>
                    {articleLoading && (
                      <div style={{ marginTop: 4, marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>{articleStage}</span>
                          <span style={{ fontSize: 12, color: "var(--muted-light)" }}>{articleProgress}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 99, background: "var(--card-border)", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, background: "var(--foreground)", width: `${articleProgress}%`, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    )}
                    {articleResult && (
                      <div style={{ fontSize: 13, color: "#15803d", paddingTop: 4 }}>
                        Published —{" "}
                        <a href={`/article/${articleResult.article_id}`} style={{ color: "#15803d", fontWeight: 500 }}>
                          {articleResult.title}
                        </a>
                      </div>
                    )}
                    {articleError && (
                      <div style={{ fontSize: 13, color: "#b91c1c", paddingTop: 4 }}>{articleError}</div>
                    )}
                  </form>
                </>
              )}
            </div>
          )}

          {/* Workflow sections by department */}
          {departments.map((dept) => (
            <section
              key={dept}
              ref={(el) => { sectionRefs.current[dept] = el; }}
              style={{ marginBottom: 48 }}
            >
              {/* Department heading */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 18, opacity: 0.5 }}>{DEPT_ICONS[dept] ?? "◈"}</span>
                <h2 style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  whiteSpace: "nowrap",
                }}>
                  {dept}
                </h2>
                <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--card-border)", margin: 0 }} />
              </div>

              {/* Cards grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {grouped[dept]?.map((w) => {
                  const level = completenessLevel(w.completeness_score);
                  const ruleCount = parseInt(w.rule_count, 10);
                  const validatedCount = parseInt(w.validated_count, 10);
                  const gapCount = parseInt(w.gap_count, 10);

                  const isConfirming = confirmingDeleteWorkflow === w.id;
                  const canDelete = me && ["editor", "admin"].includes(me.role) && ruleCount === 0;

                  return (
                    <div key={w.id} style={{ position: "relative" }}>
                      <a
                        href={`/workflow/${w.id}`}
                        className="workflow-card"
                        style={{
                          display: "block",
                          padding: 20,
                          borderRadius: 12,
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        {/* Top row: dept badge + completeness */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: 99,
                            border: "1px solid var(--card-border)",
                            color: "var(--muted)",
                            background: "var(--sidebar-bg)",
                          }}>
                            {dept}
                          </span>
                          <span className={`badge-${level}`} style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99 }}>
                            {w.completeness_score}% complete
                          </span>
                        </div>

                        {/* Question headline */}
                        <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)", marginBottom: 6, lineHeight: 1.4 }}>
                          How does {w.name.toLowerCase()} work?
                        </h3>

                        {/* Description */}
                        <p style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          lineHeight: 1.6,
                          marginBottom: 16,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {w.description}
                        </p>

                        {/* Stats */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--muted-light)" }}>
                          <span>{ruleCount} rule{ruleCount !== 1 ? "s" : ""}</span>
                          <span>·</span>
                          <span>{validatedCount}/{ruleCount} validated</span>
                          {gapCount > 0 && (
                            <>
                              <span>·</span>
                              <span style={{ color: "#d97706" }}>{gapCount} gap{gapCount !== 1 ? "s" : ""}</span>
                            </>
                          )}
                        </div>
                      </a>

                      {/* Delete button — only for empty workflows */}
                      {canDelete && (
                        <div
                          style={{ position: "absolute", top: 12, right: 12 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isConfirming ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--card-bg)", borderRadius: 8, border: "1px solid var(--card-border)", padding: "5px 8px" }}>
                              <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>Delete?</span>
                              <button
                                onClick={() => handleDeleteWorkflow(w.id)}
                                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmingDeleteWorkflow(null)}
                                style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingDeleteWorkflow(w.id)}
                              title="Delete workflow"
                              style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", cursor: "pointer", opacity: 0.7 }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function ChevronIcon({ rotated }: { rotated: boolean }) {
  return (
    <svg
      width={12} height={12}
      fill="none" stroke="currentColor" strokeWidth={2}
      viewBox="0 0 24 24"
      style={{ display: "block", transition: "transform 0.15s", transform: rotated ? "rotate(90deg)" : "none", color: "var(--muted-light)" }}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
