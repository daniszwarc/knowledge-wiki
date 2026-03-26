"use client";

import { useEffect, useState } from "react";

interface PendingRule {
  id: string;
  workflow_id: string;
  workflow_name: string;
  department: string;
  summary: string;
  detail: string | null;
  rule_type: string;
  confidence: "high" | "medium" | "low";
  owner_name: string | null;
  owner_email: string | null;
  source: string | null;
}

interface GroupedWorkflow {
  workflow_id: string;
  workflow_name: string;
  department: string;
  rules: PendingRule[];
}

const DEPT_ICONS: Record<string, string> = {
  Finance: "₣",
  Operations: "⚙",
  IT: "⌨",
};


export default function ValidationReviewPage() {
  const [rules, setRules] = useState<PendingRule[]>([]);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [actioned, setActioned] = useState<Set<string>>(new Set());
  const [validatingRule, setValidatingRule] = useState<string | null>(null);
  const [validatorInput, setValidatorInput] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [dept, setDept] = useState("All");
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetch("/api/validate/pending")
      .then((r) => r.json())
      .then((data: PendingRule[]) => {
        setRules(data);
        setTotalCount(data.length);
        setLoading(false);
      });
  }, []);

  const departments = ["All", ...Array.from(new Set(rules.map((r) => r.department))).sort()];

  const visible = rules.filter(
    (r) => !skipped.has(r.id) && (dept === "All" || r.department === dept)
  );

  // Group by workflow
  const grouped: GroupedWorkflow[] = [];
  const seen = new Map<string, GroupedWorkflow>();
  for (const r of visible) {
    if (!seen.has(r.workflow_id)) {
      const g: GroupedWorkflow = { workflow_id: r.workflow_id, workflow_name: r.workflow_name, department: r.department, rules: [] };
      seen.set(r.workflow_id, g);
      grouped.push(g);
    }
    seen.get(r.workflow_id)!.rules.push(r);
  }

  const validatedCount = actioned.size;
  const progress = totalCount > 0 ? Math.round((validatedCount / totalCount) * 100) : 0;

  async function handleValidate(ruleId: string) {
    const name = validatorInput.trim();
    if (!name) return;
    setValidatingRule(null);
    setValidatorInput("");
    await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleId, validatedBy: name }),
    });
    setActioned((prev) => new Set(prev).add(ruleId));
    setSkipped((prev) => new Set(prev).add(ruleId));
  }

  async function handleFlag(rule: PendingRule) {
    await fetch("/api/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruleId: rule.id,
        workflowId: rule.workflow_id,
        reason: `Rule flagged as outdated during validation review: "${rule.summary}"`,
        flaggedBy: "anonymous",
      }),
    });
    setSkipped((prev) => new Set(prev).add(rule.id));
  }

  function handleSkip(ruleId: string) {
    setSkipped((prev) => new Set(prev).add(ruleId));
  }

  async function handleDelete(ruleId: string) {
    await fetch(`/api/rules/${ruleId}`, { method: "DELETE" });
    setConfirmingDelete(null);
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    setTotalCount((prev) => prev - 1);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--background)",
        borderBottom: "1px solid var(--sidebar-border)",
        padding: "12px 32px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <a href="/" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
          <span>←</span> Home
        </a>
        <span style={{ fontSize: 12, color: "var(--muted-light)", opacity: 0.5 }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Validation review</span>

        {/* Department filter */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => setDept(d)}
              style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 6,
                border: "1px solid var(--card-border)", cursor: "pointer",
                background: dept === d ? "var(--foreground)" : "transparent",
                color: dept === d ? "var(--background)" : "var(--muted)",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 820, width: "100%", padding: "32px 32px 64px" }}>

        {/* Header + progress */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginBottom: 8 }}>
            Validation review
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: 520, marginBottom: 16 }}>
            Review and validate unconfirmed rules across all workflows.
            Validate rules you can confirm, flag ones that are outdated, or skip to come back later.
          </p>

          {!loading && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {validatedCount} of {totalCount} rules validated
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{progress}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "var(--card-border)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: progress === 100 ? "#15803d" : "#3b82f6",
                  width: `${progress}%`,
                  transition: "width 0.3s ease",
                }} />
              </div>
            </>
          )}
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ borderRadius: 10, border: "1px solid var(--card-border)", overflow: "hidden" }}>
                <div style={{ height: 44, background: "var(--card-hover-bg)", opacity: 0.5 }} />
                <div style={{ padding: 16, height: 80, background: "var(--card-bg)", opacity: 0.3 }} />
              </div>
            ))}
          </div>
        )}

        {!loading && grouped.length === 0 && (
          <div style={{
            padding: "48px 24px", textAlign: "center",
            border: "1px solid var(--card-border)", borderRadius: 12, color: "var(--muted)",
          }}>
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>All caught up</p>
            <p style={{ fontSize: 13 }}>No unvalidated rules remaining{dept !== "All" ? ` in ${dept}` : ""}.</p>
          </div>
        )}

        {!loading && grouped.map((wf) => {
          const allActioned = wf.rules.every((r) => actioned.has(r.id));
          return (
            <div
              key={wf.workflow_id}
              style={{ marginBottom: 28, border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden" }}
            >
              {/* Workflow header */}
              <div style={{
                padding: "12px 18px",
                background: "var(--sidebar-bg)",
                borderBottom: "1px solid var(--card-border)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 14, opacity: 0.5 }}>{DEPT_ICONS[wf.department] ?? "◈"}</span>
                <a
                  href={`/workflow/${wf.workflow_id}`}
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", textDecoration: "none" }}
                >
                  {wf.workflow_name}
                </a>
                <span style={{
                  fontSize: 11, padding: "1px 7px", borderRadius: 99,
                  border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--muted)",
                }}>
                  {wf.department}
                </span>
                {allActioned ? (
                  <span style={{
                    marginLeft: "auto", fontSize: 11, fontWeight: 600,
                    padding: "2px 8px", borderRadius: 99,
                    background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0",
                  }}>
                    ✓ Complete
                  </span>
                ) : (
                  <span style={{
                    marginLeft: "auto", fontSize: 11,
                    padding: "2px 8px", borderRadius: 99,
                    background: "var(--card-bg)", color: "var(--muted)", border: "1px solid var(--card-border)",
                  }}>
                    {wf.rules.filter((r) => !actioned.has(r.id)).length} pending
                  </span>
                )}
              </div>

              {/* Rule list */}
              <div>
                {wf.rules.map((rule, idx) => {
                  const isEntering = validatingRule === rule.id;
                  const isDone = actioned.has(rule.id);
                  return (
                    <div
                      key={rule.id}
                      style={{
                        padding: "16px 18px",
                        borderBottom: idx < wf.rules.length - 1 ? "1px solid var(--card-border)" : "none",
                        background: isDone ? "var(--sidebar-bg)" : "var(--card-bg)",
                        opacity: isDone ? 0.5 : 1,
                        transition: "opacity 0.2s",
                      }}
                    >
                      {/* Top row: type */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "var(--muted-light)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {rule.rule_type}
                        </span>
                      </div>

                      {/* Summary */}
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)", marginBottom: 4, lineHeight: 1.45 }}>
                        {rule.summary}
                      </p>

                      {/* Detail */}
                      {rule.detail && (
                        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, marginBottom: 10 }}>
                          {rule.detail}
                        </p>
                      )}

                      {/* Meta */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--muted-light)", marginBottom: 12 }}>
                        {rule.owner_name && (
                          <span>
                            <span style={{ opacity: 0.6 }}>Owner</span>{" "}
                            <a href={`mailto:${rule.owner_email}`} style={{ color: "var(--muted)", fontWeight: 500, textDecoration: "none" }}>
                              {rule.owner_name}
                            </a>
                          </span>
                        )}
                        {rule.source && (
                          <>
                            {rule.owner_name && <span style={{ opacity: 0.4 }}>·</span>}
                            <span style={{ opacity: 0.7 }}>Source: {rule.source}</span>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      {!isDone && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isEntering ? (
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
                                style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, width: 140 }}
                              />
                              <button
                                onClick={() => handleValidate(rule.id)}
                                disabled={!validatorInput.trim()}
                                style={{
                                  fontSize: 12, padding: "4px 12px", borderRadius: 6,
                                  border: "1px solid #86efac", background: "#f0fdf4", color: "#15803d",
                                  cursor: validatorInput.trim() ? "pointer" : "not-allowed",
                                  opacity: validatorInput.trim() ? 1 : 0.5,
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => { setValidatingRule(null); setValidatorInput(""); }}
                                style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                              >
                                ✕
                              </button>
                            </>
                          ) : confirmingDelete === rule.id ? (
                            <>
                              <span style={{ fontSize: 12, color: "var(--muted)", marginRight: 4 }}>Are you sure?</span>
                              <button
                                onClick={() => handleDelete(rule.id)}
                                style={{
                                  fontSize: 12, padding: "4px 12px", borderRadius: 6,
                                  border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
                                  cursor: "pointer", fontWeight: 500,
                                }}
                              >
                                Yes, delete
                              </button>
                              <button
                                onClick={() => setConfirmingDelete(null)}
                                style={{
                                  fontSize: 12, padding: "4px 8px", borderRadius: 6,
                                  border: "1px solid var(--card-border)", background: "none", color: "var(--muted)",
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setValidatingRule(rule.id)}
                                style={{
                                  fontSize: 12, padding: "4px 12px", borderRadius: 6,
                                  border: "1px solid #86efac", background: "#f0fdf4", color: "#15803d",
                                  cursor: "pointer", fontWeight: 500,
                                }}
                              >
                                Validate
                              </button>
                              <button
                                onClick={() => handleFlag(rule)}
                                style={{
                                  fontSize: 12, padding: "4px 12px", borderRadius: 6,
                                  border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e",
                                  cursor: "pointer",
                                }}
                              >
                                Flag as outdated
                              </button>
                              <button
                                onClick={() => handleSkip(rule.id)}
                                style={{
                                  fontSize: 12, padding: "4px 12px", borderRadius: 6,
                                  border: "1px solid var(--card-border)", background: "none", color: "var(--muted)",
                                  cursor: "pointer",
                                }}
                              >
                                Skip
                              </button>
                              <button
                                onClick={() => setConfirmingDelete(rule.id)}
                                style={{
                                  fontSize: 12, padding: "4px 12px", borderRadius: 6,
                                  border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
