"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Rule {
  id: string;
  workflow_id: string;
  summary: string;
  detail: string | null;
  rule_type: string;
  confidence: "high" | "medium" | "low";
  stakeholder_validated: boolean;
  stakeholder_notes: string | null;
  owner_email: string | null;
  owner_name: string | null;
  source: string | null;
  source_url: string | null;
}

interface Workflow {
  id: string;
  name: string;
  department: string;
  description: string;
  completeness_score: number;
  rules: Rule[];
}

interface AllWorkflow {
  id: string;
  name: string;
  department: string;
}

interface GroupedWorkflows {
  [dept: string]: AllWorkflow[];
}

const DEPT_ICONS: Record<string, string> = {
  Finance: "₣",
  Operations: "⚙",
  IT: "⌨",
};

function confidenceBadgeStyle(c: "high" | "medium" | "low") {
  if (c === "high")
    return {
      background: "var(--badge-high-bg, #dcfce7)",
      color: "var(--badge-high-text, #15803d)",
      border: "1px solid var(--badge-high-border, #bbf7d0)",
    };
  if (c === "medium")
    return {
      background: "var(--badge-med-bg, #fef9c3)",
      color: "var(--badge-med-text, #a16207)",
      border: "1px solid var(--badge-med-border, #fde047)",
    };
  return {
    background: "var(--badge-low-bg, #fee2e2)",
    color: "var(--badge-low-text, #b91c1c)",
    border: "1px solid var(--badge-low-border, #fecaca)",
  };
}

function completenessLevel(score: number): "high" | "medium" | "low" {
  if (score >= 80) return "high";
  if (score >= 55) return "medium";
  return "low";
}

export default function WorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [allWorkflows, setAllWorkflows] = useState<AllWorkflow[]>([]);
  const [grouped, setGrouped] = useState<GroupedWorkflows>({});
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [flaggedRules, setFlaggedRules] = useState<Set<string>>(new Set());
  const [flaggingRule, setFlaggingRule] = useState<string | null>(null);
  const [highlightedRule, setHighlightedRule] = useState<string | null>(null);
  const [validatedRules, setValidatedRules] = useState<Set<string>>(new Set());
  const [validatingRule, setValidatingRule] = useState<string | null>(null);
  const [validatorInput, setValidatorInput] = useState("");

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/workflows/${id}`).then((r) => r.json()),
      fetch("/api/workflows").then((r) => r.json()),
    ]).then(([wf, all]: [Workflow, AllWorkflow[]]) => {
      setWorkflow(wf);
      const g: GroupedWorkflows = {};
      for (const w of all) {
        if (!g[w.department]) g[w.department] = [];
        g[w.department].push(w);
      }
      setAllWorkflows(all);
      setGrouped(g);
      const depts = Object.keys(g).sort();
      const open: Record<string, boolean> = {};
      depts.forEach((d) => (open[d] = d === wf.department));
      setOpenDepts(open);
      setLoading(false);
    });

    // highlight from URL hash
    if (window.location.hash) {
      setHighlightedRule(window.location.hash.replace("#", ""));
    }
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const rulesByType = workflow
    ? workflow.rules.reduce<Record<string, Rule[]>>((acc, r) => {
        const t = r.rule_type || "general";
        if (!acc[t]) acc[t] = [];
        acc[t].push(r);
        return acc;
      }, {})
    : {};

  async function handleFlag(rule: Rule) {
    if (flaggedRules.has(rule.id) || flaggingRule === rule.id) return;
    setFlaggingRule(rule.id);
    try {
      await fetch("/api/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleId: rule.id,
          workflowId: workflow!.id,
          reason: `Rule flagged as outdated by user: "${rule.summary}"`,
          flaggedBy: "anonymous",
        }),
      });
      setFlaggedRules((prev) => new Set(prev).add(rule.id));
    } finally {
      setFlaggingRule(null);
    }
  }

  async function handleValidate(ruleId: string) {
    const name = validatorInput.trim();
    if (!name) return;
    setValidatingRule(null);
    setValidatorInput("");
    try {
      await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId, validatedBy: name }),
      });
      setValidatedRules((prev) => {
        const next = new Set(prev).add(ruleId);
        setWorkflow((wf) => {
          if (!wf) return wf;
          const total = wf.rules.length;
          const validated = wf.rules.filter((r) => r.stakeholder_validated || next.has(r.id)).length;
          return { ...wf, completeness_score: total > 0 ? Math.round((validated / total) * 100) : 0 };
        });
        return next;
      });
    } catch {
      // silent — badge stays unchanged on error
    }
  }

  async function handleChat(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const next = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(next);
    setChatLoading(true);

    let assistantText = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, workflowId: id }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value);
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: assistantText },
        ]);
      }
    } finally {
      setChatLoading(false);
    }
  }

  function isAmber(rule: Rule) {
    return !rule.stakeholder_validated || rule.confidence === "low";
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--muted)" }}>
        Loading…
      </div>
    );
  }

  if (!workflow) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--muted)" }}>
        Workflow not found.
      </div>
    );
  }

  const depts = Object.keys(grouped).sort();
  const level = completenessLevel(workflow.completeness_score);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* ── Left sidebar: same nav as homepage ──────────────────── */}
      <aside className="sidebar" style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>

        {/* Brand */}
        <div
          style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--sidebar-border)", cursor: "pointer" }}
          onClick={() => router.push("/")}
        >
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "var(--muted)" }}>
            APi GROUP - Knowledge Wiki
          </span>
        </div>

        {/* Search shortcut */}
        <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid var(--sidebar-border)" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "7px 10px", borderRadius: 7,
              border: "1px solid var(--card-border)", background: "var(--card-bg)",
              cursor: "pointer", fontSize: 12, color: "var(--muted)",
            }}
          >
            <SearchIcon />
            <span>Search processes</span>
            <kbd style={{ marginLeft: "auto", fontSize: 10, background: "var(--card-hover-bg)", border: "1px solid var(--card-border)", padding: "1px 5px", borderRadius: 4, fontFamily: "var(--font-geist-mono)" }}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Department nav */}
        <nav style={{ flex: 1, paddingTop: 6 }}>
          {depts.map((dept) => (
            <div key={dept}>
              <button
                onClick={() => setOpenDepts((p) => ({ ...p, [dept]: !p[dept] }))}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 14px", background: "none", border: "none",
                  cursor: "pointer", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)",
                }}
              >
                <span style={{ fontSize: 14, opacity: 0.6 }}>{DEPT_ICONS[dept] ?? "◈"}</span>
                <span>{dept}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 400, color: "var(--muted-light)" }}>
                  {grouped[dept]?.length ?? 0}
                </span>
                <ChevronIcon rotated={!!openDepts[dept]} />
              </button>

              {openDepts[dept] && (
                <div style={{ marginLeft: 14, paddingLeft: 10, borderLeft: "1px solid var(--card-border)", marginBottom: 2 }}>
                  {grouped[dept]?.map((w) => {
                    const active = w.id === id;
                    return (
                      <a
                        key={w.id}
                        href={`/workflow/${w.id}`}
                        style={{
                          display: "block", padding: "5px 7px", fontSize: 12,
                          color: active ? "var(--foreground)" : "var(--muted)",
                          fontWeight: active ? 600 : 400,
                          background: active ? "var(--card-hover-bg)" : "none",
                          borderRadius: 5, textDecoration: "none",
                          borderLeft: active ? "2px solid var(--foreground)" : "2px solid transparent",
                          marginLeft: -2,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}
                      >
                        {w.name}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding: "10px 14px 14px", borderTop: "1px solid var(--sidebar-border)" }}>
          <a href="/experts" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
            Subject matter experts
          </a>
          <a href="/validate" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
            Validation review
          </a>
          <a href="/gaps" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
            Flagged gaps
          </a>
        </div>
      </aside>

      {/* ── Main: rule list ──────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto", borderRight: "1px solid var(--sidebar-border)" }}>

        {/* Page header */}
        <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid var(--sidebar-border)" }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--muted)", textDecoration: "none", marginBottom: 14 }}>
            <span>←</span> All workflows
          </a>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <span style={{
                display: "inline-block", fontSize: 11, fontWeight: 500,
                padding: "2px 8px", borderRadius: 99,
                border: "1px solid var(--card-border)",
                background: "var(--sidebar-bg)", color: "var(--muted)",
                marginBottom: 8,
              }}>
                {workflow.department}
              </span>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.3, marginBottom: 8 }}>
                How does {workflow.name.toLowerCase()} work?
              </h1>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: 560 }}>
                {workflow.description}
              </p>
            </div>

            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div style={{ ...confidenceBadgeStyle(level), display: "inline-block", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99 }}>
                {workflow.completeness_score}% complete
              </div>
              <div style={{ fontSize: 11, color: "var(--muted-light)", marginTop: 6 }}>
                {workflow.rules.length} rules · {workflow.rules.filter((r) => r.stakeholder_validated || validatedRules.has(r.id)).length} validated
              </div>
            </div>
          </div>
        </div>

        {/* Rules grouped by type */}
        <div style={{ padding: "24px 32px 64px" }}>
          {Object.entries(rulesByType).map(([type, rules]) => (
            <div key={type} style={{ marginBottom: 36 }}>
              {/* Type heading */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <h2 style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--muted)",
                  whiteSpace: "nowrap",
                }}>
                  {type}
                </h2>
                <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--card-border)", margin: 0 }} />
              </div>

              {/* Rule cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {rules.map((rule) => {
                  const amber = isAmber(rule);
                  const isHighlighted = highlightedRule === rule.id;

                  const isValidated = rule.stakeholder_validated || validatedRules.has(rule.id);
                  const isEnteringName = validatingRule === rule.id;

                  return (
                    <div
                      key={rule.id}
                      id={rule.id}
                      className="workflow-card"
                      style={{
                        padding: 18,
                        borderRadius: 10,
                        borderLeft: amber ? "3px solid #d97706" : "3px solid transparent",
                        outline: isHighlighted ? "2px solid #3b82f6" : "none",
                        outlineOffset: 2,
                      }}
                    >
                      {/* Top row: badges + actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                        {isValidated ? (
                          <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" }}>
                            ✓ Validated
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                            Unvalidated
                          </span>
                        )}

                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                          {!isValidated && (
                            isEnteringName ? (
                              <>
                                <input
                                  autoFocus
                                  className="search-input"
                                  value={validatorInput}
                                  onChange={(e) => setValidatorInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleValidate(rule.id);
                                    if (e.key === "Escape") { setValidatingRule(null); setValidatorInput(""); }
                                  }}
                                  placeholder="Your name"
                                  style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, width: 120 }}
                                />
                                <button
                                  onClick={() => handleValidate(rule.id)}
                                  disabled={!validatorInput.trim()}
                                  style={{
                                    fontSize: 11, padding: "2px 10px", borderRadius: 6,
                                    border: "1px solid #86efac", background: "#f0fdf4", color: "#15803d",
                                    cursor: validatorInput.trim() ? "pointer" : "not-allowed",
                                    opacity: validatorInput.trim() ? 1 : 0.5,
                                  }}
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => { setValidatingRule(null); setValidatorInput(""); }}
                                  style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setValidatingRule(rule.id)}
                                style={{
                                  fontSize: 11, padding: "2px 10px", borderRadius: 6,
                                  border: "1px solid #86efac", background: "#f0fdf4", color: "#15803d",
                                  cursor: "pointer",
                                }}
                              >
                                Mark as validated
                              </button>
                            )
                          )}

                          <button
                            onClick={() => handleFlag(rule)}
                            disabled={flaggedRules.has(rule.id) || flaggingRule === rule.id}
                            style={{
                              fontSize: 11, padding: "2px 10px", borderRadius: 6,
                              border: "1px solid var(--card-border)",
                              background: flaggedRules.has(rule.id) ? "var(--card-hover-bg)" : "none",
                              color: flaggedRules.has(rule.id) ? "var(--muted-light)" : "var(--muted)",
                              cursor: flaggedRules.has(rule.id) || flaggingRule === rule.id ? "not-allowed" : "pointer",
                              opacity: flaggingRule === rule.id ? 0.5 : 1,
                            }}
                          >
                            {flaggedRules.has(rule.id) ? "Flagged" : flaggingRule === rule.id ? "Flagging…" : "Flag as outdated"}
                          </button>
                        </div>
                      </div>

                      {/* Summary */}
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)", marginBottom: 6, lineHeight: 1.45 }}>
                        {rule.summary}
                      </p>

                      {/* Detail */}
                      {rule.detail && (
                        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, marginBottom: 10 }}>
                          {rule.detail}
                        </p>
                      )}

                      {/* Footer: owner + source */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--muted-light)" }}>
                        {rule.owner_name && (
                          <span>
                            <span style={{ opacity: 0.6 }}>Owner</span>{" "}
                            <a href={`mailto:${rule.owner_email}`} style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>
                              {rule.owner_name}
                            </a>
                          </span>
                        )}
                        {rule.source && (
                          <>
                            <span style={{ opacity: 0.4 }}>·</span>
                            <span style={{ opacity: 0.7 }}>Source: {rule.source}</span>
                          </>
                        )}
                        {rule.stakeholder_notes && (
                          <>
                            <span style={{ opacity: 0.4 }}>·</span>
                            <span style={{ fontStyle: "italic", opacity: 0.8 }}>{rule.stakeholder_notes}</span>
                          </>
                        )}
                        {rule.source_url && (
                          <>
                            <span style={{ opacity: 0.4 }}>·</span>
                            <a
                              href={rule.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}
                            >
                              View source document
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Right panel: AI chat ─────────────────────────────────── */}
      <div style={{
        width: 340, flexShrink: 0,
        display: "flex", flexDirection: "column",
        background: "var(--sidebar-bg)",
      }}>
        {/* Chat header */}
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--sidebar-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 2 }}>
              Ask about this workflow
            </p>
            <p style={{ fontSize: 11, color: "var(--muted)" }}>
              Answers are grounded in the rules shown on the left.
            </p>
          </div>
          {chatMessages.length > 0 && (
            <button
              type="button"
              onClick={() => setChatMessages([])}
              style={{
                fontSize: 11,
                color: "var(--muted-light)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                flexShrink: 0,
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {chatMessages.length === 0 && (
            <div style={{ color: "var(--muted-light)", fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
              <p style={{ marginBottom: 10 }}>Suggested questions:</p>
              {[
                "Who is responsible for approvals?",
                "What are the key controls in this process?",
                "What happens if a rule is violated?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setChatInput(q)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    fontSize: 12, color: "var(--muted)", padding: "7px 10px",
                    border: "1px solid var(--card-border)", borderRadius: 7,
                    background: "var(--card-bg)", cursor: "pointer", marginBottom: 6,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "88%", padding: "9px 12px", borderRadius: 10,
                fontSize: 12, lineHeight: 1.65,
                background: msg.role === "user" ? "var(--foreground)" : "var(--card-bg)",
                color: msg.role === "user" ? "var(--background)" : "var(--foreground)",
                border: msg.role === "assistant" ? "1px solid var(--card-border)" : "none",
                whiteSpace: "pre-wrap",
              }}>
                {msg.content || (chatLoading && i === chatMessages.length - 1 ? "…" : "")}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "10px 12px 14px", borderTop: "1px solid var(--sidebar-border)" }}>
          <form onSubmit={handleChat} style={{ display: "flex", gap: 7 }}>
            <input
              className="search-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question…"
              style={{ flex: 1, padding: "8px 12px", fontSize: 12, borderRadius: 7 }}
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              style={{
                padding: "8px 14px", fontSize: 12, fontWeight: 500,
                borderRadius: 7, border: "none",
                background: "var(--foreground)", color: "var(--background)",
                cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                opacity: chatLoading || !chatInput.trim() ? 0.4 : 1,
                flexShrink: 0,
              }}
            >
              ↑
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

function SearchIcon() {
  return (
    <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ display: "block" }}>
      <circle cx={11} cy={11} r={8} />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ChevronIcon({ rotated }: { rotated: boolean }) {
  return (
    <svg
      width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2}
      viewBox="0 0 24 24"
      style={{ display: "block", transition: "transform 0.15s", transform: rotated ? "rotate(90deg)" : "none", color: "var(--muted-light)" }}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
