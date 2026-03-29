"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

function DeptCombobox({
  value,
  onChange,
  departments,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  departments: string[];
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = departments.filter((d) =>
    d.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", ...style }}>
      <input
        className="search-input"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Department"
        autoComplete="off"
        style={{ width: "100%", padding: "9px 14px", fontSize: 13, borderRadius: 8, boxSizing: "border-box" }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
          background: "var(--background)", border: "1px solid var(--card-border)",
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", overflow: "hidden",
        }}>
          {filtered.map((d) => (
            <div
              key={d}
              onMouseDown={(e) => { e.preventDefault(); onChange(d); setOpen(false); }}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: "8px 14px", fontSize: 13, cursor: "pointer",
                background: hovered === d ? "var(--muted-bg, rgba(0,0,0,0.06))" : d === value ? "var(--muted-bg, rgba(0,0,0,0.04))" : "transparent",
                fontWeight: d === value ? 500 : 400,
              }}
            >
              {d}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSlow, setChatSlow] = useState(false);
  const chatSlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Nav data (includes articles per dept)
  const [navData, setNavData] = useState<NavDept[]>([]);

  // Workflow delete state
  const [confirmingDeleteWorkflow, setConfirmingDeleteWorkflow] = useState<string | null>(null);

  // Upload state
  const [uploadTab, setUploadTab] = useState<"file" | "text">("file");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadWorkflow, setUploadWorkflow] = useState("");
  const [uploadDept, setUploadDept] = useState("");
  const [uploadOwnerName, setUploadOwnerName] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadResult, setUploadResult] = useState<{
    document_type: "rules" | "article" | "both";
    rules_extracted?: number;
    workflow_name?: string;
    workflow_id?: string;
    article_id?: string;
    article_title?: string;
  } | null>(null);
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
  const [pasteProgress, setPasteProgress] = useState(0);
  const [pasteStage, setPasteStage] = useState("");
  const pasteTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteResult, setPasteResult] = useState<{
    document_type: "rules" | "article" | "both";
    rules_extracted?: number;
    workflow_name?: string;
    workflow_id?: string;
    article_id?: string;
    article_title?: string;
  } | null>(null);
  const [pasteError, setPasteError] = useState("");

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
    Promise.all([
      fetch("/api/workflows").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ]).then(([workflows, allDepts]: [Workflow[], string[]]) => {
      const g: GroupedWorkflows = {};
      for (const w of workflows) {
        if (!g[w.department]) g[w.department] = [];
        g[w.department].push(w);
      }
      setGrouped(g);
      const open: Record<string, boolean> = {};
      Object.keys(g).forEach((d) => (open[d] = false));
      setOpenDepts(open);
      setDepartments(Array.isArray(allDepts) ? allDepts : Object.keys(g).sort());
    });
  }, []);

  function extractSearchQuery(input: string): string {
    const stripped = input
      .replace(/^(what information (do you have|is there|do we have)|tell me about|how do (i|we)|what is|what are|do you have|show me|find|look up|give me information (on|about)|can you tell me about|search for)\s+/i, "")
      .replace(/\?$/, "")
      .trim();
    return stripped || input;
  }

  async function handleChat(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const q = chatInput.trim();
    setChatInput("");
    setChatResponse("");
    setChatQuestion(q);
    setChatLoading(true);
    setChatSlow(false);
    if (chatSlowTimerRef.current) clearTimeout(chatSlowTimerRef.current);
    chatSlowTimerRef.current = setTimeout(() => setChatSlow(true), 2000);
    try {
      const searchQuery = extractSearchQuery(q);
      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      type SR = { type: string; workflow_name?: string; workflow_id?: string; department?: string; summary?: string; detail?: string; article_id?: string; title?: string; snippet?: string };
      const searchResults: SR[] = searchRes.ok ? await searchRes.json() : [];
      // Group by department
      const byDept = new Map<string, { workflows: Map<string, { name: string; rules: string[] }>; articles: { title: string; id: string; snippet: string }[] }>();
      for (const r of searchResults) {
        const dept = r.department ?? "General";
        if (!byDept.has(dept)) byDept.set(dept, { workflows: new Map(), articles: [] });
        const d = byDept.get(dept)!;
        if (r.type === "rule" && r.workflow_id) {
          if (!d.workflows.has(r.workflow_id)) d.workflows.set(r.workflow_id, { name: r.workflow_name ?? "", rules: [] });
          if (r.summary) d.workflows.get(r.workflow_id)!.rules.push(r.summary);
        } else if (r.type === "article" && r.article_id) {
          d.articles.push({ title: r.title ?? "", id: r.article_id, snippet: r.snippet?.substring(0, 200) ?? "" });
        }
      }
      const contextLines: string[] = [];
      for (const [dept, data] of byDept) {
        contextLines.push(`DEPARTMENT: ${dept}`);
        for (const [wfId, wf] of data.workflows) {
          contextLines.push(`  WORKFLOW: ${wf.name}`);
          contextLines.push(`  LINK: /workflow/${wfId}`);
          if (wf.rules.length) contextLines.push(`  RULES: ${wf.rules.slice(0, 5).join(" | ")}`);
        }
        for (const art of data.articles) {
          contextLines.push(`  ARTICLE: ${art.title}`);
          contextLines.push(`  LINK: /article/${art.id}`);
          if (art.snippet) contextLines.push(`  SUMMARY: ${art.snippet}`);
        }
        contextLines.push("");
      }
      const context = contextLines.join("\n");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: q }], context, workflowId: null }),
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
      if (chatSlowTimerRef.current) clearTimeout(chatSlowTimerRef.current);
      setChatLoading(false);
      setChatSlow(false);
    }
  }

  function refreshWorkflows() {
    Promise.all([
      fetch("/api/workflows").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ]).then(([data, allDepts]: [Workflow[], string[]]) => {
      const g: GroupedWorkflows = {};
      for (const w of data) {
        if (!g[w.department]) g[w.department] = [];
        g[w.department].push(w);
      }
      setGrouped(g);
      setDepartments(Array.isArray(allDepts) ? allDepts : Object.keys(g).sort());
      setOpenDepts((prev) => {
        const next = { ...prev };
        Object.keys(g).forEach((d) => { if (!(d in next)) next[d] = false; });
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

    const stages: [number, number, string][] = [
      [500,   8,  "Uploading file…"],
      [2000,  18, "Classifying document…"],
      [8000,  32, "Processing…"],
      [25000, 48, "Processing…"],
      [55000, 62, "Still working — this can take a minute…"],
      [100000, 74, "Almost there…"],
      [160000, 84, "Finalising…"],
      [220000, 92, "Just a moment…"],
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
      if (uploadOwnerName.trim()) fd.append("owner_name", uploadOwnerName.trim());
      const res = await fetch("http://localhost:8000/ingest", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Upload failed");
      }
      const json = await res.json();
      uploadTimersRef.current.forEach(clearTimeout);
      setUploadProgress(100);
      setUploadStage("Done");
      setUploadResult({
        document_type: json.document_type,
        rules_extracted: json.rules_extracted,
        workflow_name: uploadWorkflow.trim(),
        workflow_id: json.workflow_id,
        article_id: json.article_id,
        article_title: json.article_title,
      });
      const usedDept = uploadDept.trim();
      setUploadFile(null);
      setUploadWorkflow("");
      setUploadDept("");
      setUploadOwnerName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setDepartments((prev) => prev.includes(usedDept) ? prev : [...prev, usedDept].sort());
      refreshWorkflows();
      refreshNav();
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
    setPasteProgress(0);

    const pasteStages: [number, number, string][] = [
      [500,   8,  "Submitting…"],
      [2000,  18, "Classifying document…"],
      [8000,  32, "Processing…"],
      [25000, 48, "Processing…"],
      [55000, 62, "Still working — this can take a minute…"],
      [100000, 74, "Almost there…"],
      [160000, 84, "Finalizing…"],
      [220000, 92, "Just a moment…"],
    ];
    pasteTimersRef.current.forEach(clearTimeout);
    pasteTimersRef.current = pasteStages.map(([delay, pct, label]) =>
      setTimeout(() => { setPasteProgress(pct); setPasteStage(label); }, delay)
    );

    try {
      const res = await fetch("http://localhost:8000/ingest/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pasteText.trim(),
          workflow_name: pasteWorkflow.trim(),
          department: pasteDept.trim(),
          ...(pasteOwnerName.trim() && { owner_name: pasteOwnerName.trim() }),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Submission failed");
      }
      const json = await res.json();
      pasteTimersRef.current.forEach(clearTimeout);
      setPasteProgress(100);
      setPasteStage("Done");
      setPasteResult({
        document_type: json.document_type,
        rules_extracted: json.rules_extracted,
        workflow_name: pasteWorkflow.trim(),
        workflow_id: json.workflow_id,
        article_id: json.article_id,
        article_title: json.article_title,
      });
      const usedDept = pasteDept.trim();
      setPasteText("");
      setPasteWorkflow("");
      setPasteDept("");
      setPasteOwnerName("");
      setDepartments((prev) => prev.includes(usedDept) ? prev : [...prev, usedDept].sort());
      refreshWorkflows();
      refreshNav();
    } catch (err) {
      pasteTimersRef.current.forEach(clearTimeout);
      setPasteProgress(0);
      setPasteStage("");
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
            {(chatLoading || chatResponse) && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--card-border)" }}>
                {chatQuestion && (
                  <p style={{ fontSize: 12, color: "var(--muted-light)", marginBottom: 10, fontStyle: "italic" }}>
                    "{chatQuestion}"
                  </p>
                )}
                {chatLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>
                      Searching the knowledge base
                      <span style={{ display: "inline-block", animation: "chatDots 1.2s steps(4, end) infinite" }}>...</span>
                    </span>
                    {chatSlow && (
                      <span style={{ fontSize: 12, color: "var(--muted-light)" }}>This may take a moment…</span>
                    )}
                    <style>{`@keyframes chatDots { 0%,20%{color:transparent;text-shadow:.4em 0 0 transparent,.8em 0 0 transparent} 40%{color:var(--muted);text-shadow:.4em 0 0 transparent,.8em 0 0 transparent} 60%{text-shadow:.4em 0 0 var(--muted),.8em 0 0 transparent} 80%,100%{text-shadow:.4em 0 0 var(--muted),.8em 0 0 var(--muted)} }`}</style>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                      <button
                        type="button"
                        onClick={() => { setChatResponse(""); setChatQuestion(""); }}
                        style={{ fontSize: 11, color: "var(--muted-light)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
                      >
                        Clear
                      </button>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.7 }}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p style={{ margin: "0 0 8px", lineHeight: 1.7, fontSize: 13 }}>{children}</p>,
                          strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                          em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
                          ul: ({ children }) => <ul style={{ marginLeft: 20, marginBottom: 8, lineHeight: 1.7, listStyleType: "disc" }}>{children}</ul>,
                          ol: ({ children }) => <ol style={{ marginLeft: 20, marginBottom: 8, lineHeight: 1.7 }}>{children}</ol>,
                          li: ({ children }) => <li style={{ marginBottom: 4, fontSize: 13 }}>{children}</li>,
                          a: ({ href, children }) => (
                            <a href={href} style={{ color: "var(--foreground)", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: 2 }}>
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {chatResponse.replace(/(?<!\]\()(\/(workflow|article)\/[0-9a-f-]{36})/g, "[$1]($1)")}
                      </ReactMarkdown>
                    </div>
                  </>
                )}
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
              {/* Tab switcher */}
              <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
                {(["file", "text"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => { setUploadTab(tab); setUploadResult(null); setPasteResult(null); }}
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "5px 12px",
                      borderRadius: 7,
                      border: "1px solid var(--card-border)",
                      cursor: "pointer",
                      background: uploadTab === tab ? "var(--card-hover-bg)" : "transparent",
                      color: uploadTab === tab ? "var(--foreground)" : "var(--muted)",
                    }}
                  >
                    {tab === "file" ? "Upload document" : "Paste text"}
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
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                      <input
                        className="search-input"
                        value={uploadWorkflow}
                        onChange={(e) => setUploadWorkflow(e.target.value)}
                        placeholder="Workflow / topic name"
                        style={{ padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                      />
                      <span style={{ fontSize: 11, color: "var(--muted-light)", paddingLeft: 4 }}>
                        Name of the process or topic this document relates to
                      </span>
                    </div>
                    <DeptCombobox
                      value={uploadDept}
                      onChange={setUploadDept}
                      departments={departments}
                      style={{ flex: 1, alignSelf: "flex-start" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                    <input
                      className="search-input"
                      value={uploadOwnerName}
                      onChange={(e) => setUploadOwnerName(e.target.value)}
                      placeholder="Owner name (optional)"
                      style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                    />
                    <button
                      type="submit"
                      disabled={uploadLoading || !uploadFile || !uploadWorkflow.trim() || !uploadDept.trim()}
                      style={{
                        padding: "9px 18px", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none",
                        background: "var(--foreground)", color: "var(--background)",
                        cursor: uploadLoading || !uploadFile || !uploadWorkflow.trim() || !uploadDept.trim() ? "not-allowed" : "pointer",
                        opacity: uploadLoading || !uploadFile || !uploadWorkflow.trim() || !uploadDept.trim() ? 0.45 : 1,
                        flexShrink: 0, whiteSpace: "nowrap",
                      }}
                    >
                      {uploadLoading ? "Processing…" : "Upload and process"}
                    </button>
                  </div>
                  {uploadLoading && (
                    <div style={{ marginBottom: 6 }}>
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
                      {uploadResult.document_type === "article" ? (
                        <>
                          Published article:{" "}
                          <a href={`/article/${uploadResult.article_id}`} style={{ color: "#15803d", fontWeight: 500 }}>
                            {uploadResult.article_title}
                          </a>
                        </>
                      ) : uploadResult.document_type === "both" ? (
                        <>
                          Extracted {uploadResult.rules_extracted} rule{uploadResult.rules_extracted !== 1 ? "s" : ""} and published article:{" "}
                          {uploadResult.workflow_id ? (
                            <a href={`/workflow/${uploadResult.workflow_id}`} style={{ color: "#15803d", fontWeight: 500 }}>
                              {uploadResult.workflow_name}
                            </a>
                          ) : (
                            <strong>{uploadResult.workflow_name}</strong>
                          )}
                          {uploadResult.article_id && (
                            <>
                              {" · "}
                              <a href={`/article/${uploadResult.article_id}`} style={{ color: "#15803d", fontWeight: 500 }}>
                                {uploadResult.article_title}
                              </a>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          Extracted {uploadResult.rules_extracted} rule{uploadResult.rules_extracted !== 1 ? "s" : ""} from{" "}
                          {uploadResult.workflow_id ? (
                            <a href={`/workflow/${uploadResult.workflow_id}`} style={{ color: "#15803d", fontWeight: 500 }}>
                              {uploadResult.workflow_name}
                            </a>
                          ) : (
                            <strong>{uploadResult.workflow_name}</strong>
                          )}
                        </>
                      )}
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
                    <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                      <input
                        className="search-input"
                        value={pasteWorkflow}
                        onChange={(e) => setPasteWorkflow(e.target.value)}
                        placeholder="Workflow / topic name"
                        style={{ padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                      />
                      <span style={{ fontSize: 11, color: "var(--muted-light)", paddingLeft: 4 }}>
                        Name of the process or topic this document relates to
                      </span>
                    </div>
                    <DeptCombobox
                      value={pasteDept}
                      onChange={setPasteDept}
                      departments={departments}
                      style={{ flex: 1, alignSelf: "flex-start" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                    <input
                      className="search-input"
                      value={pasteOwnerName}
                      onChange={(e) => setPasteOwnerName(e.target.value)}
                      placeholder="Owner name (optional)"
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
                      {pasteLoading ? "Processing…" : "Upload and process"}
                    </button>
                  </div>
                  {pasteLoading && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{pasteStage}</span>
                        <span style={{ fontSize: 12, color: "var(--muted-light)" }}>{pasteProgress}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 99, background: "var(--card-border)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 99, background: "var(--foreground)", width: `${pasteProgress}%`, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  )}
                  {pasteResult && (
                    <div style={{ fontSize: 13, color: "#15803d", paddingTop: 4 }}>
                      {pasteResult.document_type === "article" ? (
                        <>
                          Published article:{" "}
                          <a href={`/article/${pasteResult.article_id}`} style={{ color: "#15803d", fontWeight: 500 }}>
                            {pasteResult.article_title}
                          </a>
                        </>
                      ) : pasteResult.document_type === "both" ? (
                        <>
                          Extracted {pasteResult.rules_extracted} rule{pasteResult.rules_extracted !== 1 ? "s" : ""} and published article:{" "}
                          {pasteResult.workflow_id ? (
                            <a href={`/workflow/${pasteResult.workflow_id}`} style={{ color: "#15803d", fontWeight: 500 }}>
                              {pasteResult.workflow_name}
                            </a>
                          ) : (
                            <strong>{pasteResult.workflow_name}</strong>
                          )}
                          {pasteResult.article_id && (
                            <>
                              {" · "}
                              <a href={`/article/${pasteResult.article_id}`} style={{ color: "#15803d", fontWeight: 500 }}>
                                {pasteResult.article_title}
                              </a>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          Extracted {pasteResult.rules_extracted} rule{pasteResult.rules_extracted !== 1 ? "s" : ""} from{" "}
                          {pasteResult.workflow_id ? (
                            <a href={`/workflow/${pasteResult.workflow_id}`} style={{ color: "#15803d", fontWeight: 500 }}>
                              {pasteResult.workflow_name}
                            </a>
                          ) : (
                            <strong>{pasteResult.workflow_name}</strong>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {pasteError && (
                    <div style={{ fontSize: 13, color: "#b91c1c", paddingTop: 4 }}>{pasteError}</div>
                  )}
                </form>
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
