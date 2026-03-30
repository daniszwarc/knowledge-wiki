"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sidebar } from "@/components/Sidebar";

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
  process_narrative: string | null;
  narrative_generated_at: string | null;
}

interface RefArticle {
  id: string;
  title: string;
  department: string | null;
  workflow_name: string | null;
  stakeholder_validated: boolean;
}



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
  const [me, setMe] = useState<{ id: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [flaggedRules, setFlaggedRules] = useState<Set<string>>(new Set());
  const [flaggingRule, setFlaggingRule] = useState<string | null>(null);
  const [highlightedRule, setHighlightedRule] = useState<string | null>(null);
  const [validatedRules, setValidatedRules] = useState<Set<string>>(new Set());
  const [validatingRule, setValidatingRule] = useState<string | null>(null);
  const [validatorInput, setValidatorInput] = useState("");
  const [confirmingDeleteWorkflow, setConfirmingDeleteWorkflow] = useState(false);
  const [deleteWorkflowLoading, setDeleteWorkflowLoading] = useState(false);
  const [deleteWorkflowError, setDeleteWorkflowError] = useState("");
  const [view, setView] = useState<"overview" | "rules">("overview");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [refArticles, setRefArticles] = useState<RefArticle[]>([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setMe(data); });
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`/api/workflows/${id}`).then((r) => r.json()),
      fetch("/api/articles").then((r) => r.json()),
    ]).then(([wf, articles]: [Workflow, RefArticle[]]) => {
      setWorkflow(wf);
      if (Array.isArray(articles)) {
        setRefArticles(articles.filter((a: RefArticle) =>
          a.workflow_name?.toLowerCase() === wf.name.toLowerCase()
        ));
      }
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

  const suggestedQuestions: string[] = workflow
    ? (() => {
        const TYPE_QUESTIONS: Record<string, string> = {
          approval: "Who needs to approve this, and what are the conditions?",
          validation: "What validations are required before proceeding?",
          exception: "What exceptions are allowed, and who can grant them?",
          escalation: "When does this process need to be escalated?",
          compliance: "What compliance or regulatory requirements apply?",
          control: "What controls are in place to prevent errors?",
          threshold: "What thresholds or limits apply in this process?",
          deadline: "What are the key deadlines in this workflow?",
          general: "What are the main rules governing this process?",
        };
        const types = Object.keys(rulesByType);
        const qs = types
          .map((t) => TYPE_QUESTIONS[t.toLowerCase()] ?? `What are the ${t} rules?`)
          .slice(0, 3);
        // If fewer than 3 types, pad with owner question if there's an owner
        if (qs.length < 3) {
          const owners = [...new Set(workflow.rules.map((r) => r.owner_name).filter(Boolean))];
          if (owners.length > 0) qs.push(`Who is responsible for this process?`);
        }
        return qs.slice(0, 3);
      })()
    : [];

  async function handleRegenerateNarrative() {
    setNarrativeLoading(true);
    try {
      const res = await fetch(`/api/workflows/${id}/generate-narrative`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setWorkflow((wf) => wf ? { ...wf, process_narrative: data.narrative, narrative_generated_at: data.generated_at } : wf);
      }
    } finally {
      setNarrativeLoading(false);
    }
  }

  async function handleDeleteWorkflow() {
    setDeleteWorkflowLoading(true);
    setDeleteWorkflowError("");
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        setDeleteWorkflowError(err.error ?? "Delete failed");
        setConfirmingDeleteWorkflow(false);
        return;
      }
      router.push("/");
    } finally {
      setDeleteWorkflowLoading(false);
    }
  }

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

  const level = completenessLevel(workflow.completeness_score);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* ── Left sidebar ─────────────────────────────────────────── */}
      <Sidebar activeWorkflowId={id} me={me} />

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
              {me && ["editor", "admin"].includes(me.role) && workflow.rules.length === 0 && (
                <div style={{ marginTop: 10 }}>
                  {confirmingDeleteWorkflow ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>Delete this workflow? This cannot be undone.</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={handleDeleteWorkflow}
                          disabled={deleteWorkflowLoading}
                          style={{
                            fontSize: 11, padding: "3px 10px", borderRadius: 6,
                            border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
                            cursor: deleteWorkflowLoading ? "not-allowed" : "pointer", fontWeight: 500,
                            opacity: deleteWorkflowLoading ? 0.6 : 1,
                          }}
                        >
                          {deleteWorkflowLoading ? "Deleting…" : "Yes, delete"}
                        </button>
                        <button
                          onClick={() => setConfirmingDeleteWorkflow(false)}
                          style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                      {deleteWorkflowError && (
                        <span style={{ fontSize: 11, color: "#b91c1c" }}>{deleteWorkflowError}</span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingDeleteWorkflow(true)}
                      style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 6,
                        border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
                        cursor: "pointer",
                      }}
                    >
                      Delete workflow
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View toggle */}
        <div style={{ padding: "0 32px", borderBottom: "1px solid var(--sidebar-border)" }}>
          <div style={{ display: "flex", gap: 4, padding: "12px 0" }}>
            {(["overview", "rules"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  fontSize: 12, fontWeight: 500, padding: "5px 16px",
                  borderRadius: 99, border: "1px solid var(--card-border)",
                  background: view === v ? "var(--foreground)" : "none",
                  color: view === v ? "var(--background)" : "var(--muted)",
                  cursor: "pointer",
                }}
              >
                {v === "overview" ? "Overview" : "Rules"}
              </button>
            ))}
          </div>
        </div>

        {/* Overview view */}
        {view === "overview" && (
          <div style={{ padding: "28px 32px 40px", maxWidth: 720 }}>
            {workflow.process_narrative ? (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginTop: 28, marginBottom: 10, letterSpacing: "-0.01em" }}>{children}</h2>,
                    h3: ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginTop: 20, marginBottom: 8 }}>{children}</h3>,
                    p: ({ children }) => <p style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.75, marginBottom: 14 }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ marginLeft: 20, marginBottom: 14, listStyleType: "disc" }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ marginLeft: 20, marginBottom: 14 }}>{children}</ol>,
                    li: ({ children }) => <li style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.7, marginBottom: 4 }}>{children}</li>,
                    strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                  }}
                >
                  {workflow.process_narrative}
                </ReactMarkdown>
                <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 11, color: "var(--muted-light)" }}>
                    Generated from {workflow.rules.length} documented rule{workflow.rules.length !== 1 ? "s" : ""}.{" "}
                    Last updated {relativeTime(workflow.narrative_generated_at)}.
                  </span>
                  {me && ["editor", "admin"].includes(me.role) && (
                    <button
                      onClick={handleRegenerateNarrative}
                      disabled={narrativeLoading}
                      style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 6,
                        border: "1px solid var(--card-border)", background: "none",
                        color: "var(--muted)", cursor: narrativeLoading ? "not-allowed" : "pointer",
                        opacity: narrativeLoading ? 0.5 : 1,
                      }}
                    >
                      {narrativeLoading ? "Regenerating…" : "Regenerate"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>No overview generated yet.</p>
                {me && ["editor", "admin"].includes(me.role) && (
                  <button
                    onClick={handleRegenerateNarrative}
                    disabled={narrativeLoading}
                    style={{
                      fontSize: 12, padding: "6px 16px", borderRadius: 7,
                      border: "1px solid var(--card-border)", background: "var(--card-bg)",
                      color: "var(--foreground)", cursor: narrativeLoading ? "not-allowed" : "pointer",
                      opacity: narrativeLoading ? 0.5 : 1, fontWeight: 500,
                    }}
                  >
                    {narrativeLoading ? "Generating…" : "Generate overview"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rules view */}
        {view === "rules" && (
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
                          {!isValidated && ["validator", "editor", "admin"].includes(me?.role ?? "") && (
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

                          {["validator", "editor", "admin"].includes(me?.role ?? "") && (
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
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)", marginBottom: 6, lineHeight: 1.45 }}>
                        {rule.summary}
                      </p>

                      {/* Detail */}
                      {rule.detail && (
                        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, marginBottom: 10, overflow: "visible", display: "block", WebkitLineClamp: "unset", whiteSpace: "pre-wrap" }}>
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
        )}

        {/* Reference documents — always visible */}
        {refArticles.length > 0 && (
          <div style={{ padding: "24px 32px 40px", borderTop: "1px solid var(--sidebar-border)" }}>
            <h2 style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>
              Reference documents
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {refArticles.map((a) => (
                <a
                  key={a.id}
                  href={`/article/${a.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 8,
                    border: "1px solid var(--card-border)", background: "var(--card-bg)",
                    textDecoration: "none",
                  }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                    background: a.stakeholder_validated ? "#4ade80" : "#f59e0b",
                  }} />
                  <span style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 500, flex: 1 }}>
                    {a.title}
                  </span>
                  {a.department && (
                    <span style={{ fontSize: 11, color: "var(--muted-light)", flexShrink: 0 }}>
                      {a.department}
                    </span>
                  )}
                  {a.stakeholder_validated && (
                    <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 99, background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe", flexShrink: 0 }}>
                      Validated
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
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
              {suggestedQuestions.map((q) => (
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
              }}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p style={{ margin: "0 0 6px", fontSize: 12, lineHeight: 1.65 }}>{children}</p>,
                      strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                      ul: ({ children }) => <ul style={{ marginLeft: 16, marginBottom: 6, listStyleType: "disc" }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ marginLeft: 16, marginBottom: 6 }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: 2, fontSize: 12 }}>{children}</li>,
                      a: ({ href, children }) => (
                        <a href={href} style={{ color: "var(--foreground)", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: 2 }}>
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {(msg.content || (chatLoading && i === chatMessages.length - 1 ? "…" : "")).replace(/(?<!\]\()(\/(workflow|article)\/[0-9a-f-]{36})/g, "[$1]($1)")}
                  </ReactMarkdown>
                ) : (
                  msg.content || (chatLoading && i === chatMessages.length - 1 ? "…" : "")
                )}
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

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "unknown";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

