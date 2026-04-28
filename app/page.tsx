"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sidebar } from "@/components/Sidebar";

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
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [confirmingDeleteWorkflow, setConfirmingDeleteWorkflow] = useState<string | null>(null);
  const [me, setMe] = useState<{ id: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setMe(data); });
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

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      <Sidebar me={me} />

      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "32px 32px 64px", maxWidth: 960, width: "100%" }}>

          {/* Hero */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--foreground)", marginBottom: 8, lineHeight: 1.3 }}>
                How do our business processes work?
              </h1>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, maxWidth: 520 }}>
                Documented rules, controls, and procedures across Finance, Operations, and IT.
                Every rule is traceable to a source and an owner.
              </p>
            </div>
            {me && ["editor", "admin", "developer"].includes(me.role) && (
              <a
                href="/upload"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "9px 18px", fontSize: 13, fontWeight: 500, borderRadius: 8,
                  background: "var(--foreground)", color: "var(--background)",
                  textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                + Add document
              </a>
            )}
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
                    &quot;{chatQuestion}&quot;
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

          {/* Workflow sections by department */}
          {departments.map((dept) => (
            <section
              key={dept}
              ref={(el) => { sectionRefs.current[dept] = el; }}
              style={{ marginBottom: 48 }}
            >
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
                        style={{ display: "block", padding: 20, borderRadius: 12, textDecoration: "none", color: "inherit" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99,
                            border: "1px solid var(--card-border)", color: "var(--muted)", background: "var(--sidebar-bg)",
                          }}>
                            {dept}
                          </span>
                          <span className={`badge-${level}`} style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99 }}>
                            {w.completeness_score}% complete
                          </span>
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)", marginBottom: 6, lineHeight: 1.4 }}>
                          How does {w.name.toLowerCase()} work?
                        </h3>
                        <p style={{
                          fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16,
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {w.description}
                        </p>
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

                      {canDelete && (
                        <div style={{ position: "absolute", top: 12, right: 12 }} onClick={(e) => e.stopPropagation()}>
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
