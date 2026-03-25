"use client";

import { useEffect, useState } from "react";

interface Gap {
  id: string;
  rule_id: string | null;
  workflow_id: string;
  workflow_name: string;
  department: string;
  reason: string;
  flagged_by: string | null;
  flagged_at: string;
  status: string;
  owner_name: string | null;
  owner_email: string | null;
}

interface GroupedGaps {
  [workflowId: string]: {
    workflow_name: string;
    department: string;
    gaps: Gap[];
  };
}

const DEPT_ICONS: Record<string, string> = {
  Finance: "₣",
  Operations: "⚙",
  IT: "⌨",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function GapsPage() {
  const [grouped, setGrouped] = useState<GroupedGaps>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gaps")
      .then((r) => r.json())
      .then((data: Gap[]) => {
        setTotalCount(data.length);
        const g: GroupedGaps = {};
        for (const gap of data) {
          if (!g[gap.workflow_id]) {
            g[gap.workflow_id] = {
              workflow_name: gap.workflow_name,
              department: gap.department,
              gaps: [],
            };
          }
          g[gap.workflow_id].gaps.push(gap);
        }
        setGrouped(g);
        setLoading(false);
      });
  }, []);

  const workflowIds = Object.keys(grouped);

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
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Flagged gaps</span>
        <span style={{
          marginLeft: "auto",
          fontSize: 11, fontWeight: 500,
          padding: "2px 8px", borderRadius: 99,
          background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a",
        }}>
          Protected
        </span>
      </div>

      <div style={{ maxWidth: 820, width: "100%", padding: "32px 32px 64px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginBottom: 8 }}>
            Open process gaps
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: 520 }}>
            Rules or workflows flagged as outdated, missing, or undocumented.
            Each gap should be reviewed by the closest owner and resolved or escalated.
          </p>
          {!loading && (
            <p style={{ fontSize: 12, color: "var(--muted-light)", marginTop: 8 }}>
              {totalCount} open gap{totalCount !== 1 ? "s" : ""} across {workflowIds.length} workflow{workflowIds.length !== 1 ? "s" : ""}
            </p>
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

        {!loading && workflowIds.length === 0 && (
          <div style={{
            padding: "48px 24px", textAlign: "center",
            border: "1px solid var(--card-border)", borderRadius: 12, color: "var(--muted)",
          }}>
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No open gaps</p>
            <p style={{ fontSize: 13 }}>All flagged items have been resolved.</p>
          </div>
        )}

        {!loading && workflowIds.map((wfId) => {
          const { workflow_name, department, gaps } = grouped[wfId];
          return (
            <div
              key={wfId}
              style={{
                marginBottom: 28,
                border: "1px solid var(--card-border)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* Workflow header */}
              <div style={{
                padding: "12px 18px",
                background: "var(--sidebar-bg)",
                borderBottom: "1px solid var(--card-border)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 14, opacity: 0.5 }}>{DEPT_ICONS[department] ?? "◈"}</span>
                <a
                  href={`/workflow/${wfId}`}
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", textDecoration: "none" }}
                >
                  {workflow_name}
                </a>
                <span style={{
                  fontSize: 11, padding: "1px 7px", borderRadius: 99,
                  border: "1px solid var(--card-border)",
                  background: "var(--card-bg)", color: "var(--muted)",
                }}>
                  {department}
                </span>
                <span style={{
                  marginLeft: "auto", fontSize: 11, fontWeight: 600,
                  padding: "2px 8px", borderRadius: 99,
                  background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a",
                }}>
                  {gaps.length} gap{gaps.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Gap list */}
              <div>
                {gaps.map((gap, idx) => (
                  <div
                    key={gap.id}
                    style={{
                      padding: "16px 18px",
                      borderBottom: idx < gaps.length - 1 ? "1px solid var(--card-border)" : "none",
                      background: "var(--card-bg)",
                    }}
                  >
                    {/* Reason */}
                    <p style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.55, marginBottom: 10 }}>
                      {gap.reason}
                    </p>

                    {/* Meta row */}
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12, fontSize: 11, color: "var(--muted-light)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ opacity: 0.6 }}>Flagged</span>{" "}
                        <span style={{ color: "var(--muted)", fontWeight: 500 }}>{formatDate(gap.flagged_at)}</span>
                      </span>

                      {gap.flagged_by && (
                        <>
                          <span style={{ opacity: 0.4 }}>·</span>
                          <span>
                            <span style={{ opacity: 0.6 }}>By</span>{" "}
                            <span style={{ color: "var(--muted)", fontWeight: 500 }}>{gap.flagged_by}</span>
                          </span>
                        </>
                      )}

                      {gap.owner_name && (
                        <>
                          <span style={{ opacity: 0.4 }}>·</span>
                          <span>
                            <span style={{ opacity: 0.6 }}>Closest owner</span>{" "}
                            <a
                              href={`mailto:${gap.owner_email}`}
                              style={{ color: "var(--foreground)", fontWeight: 600, textDecoration: "none" }}
                            >
                              {gap.owner_name}
                            </a>
                          </span>
                        </>
                      )}

                      {gap.rule_id && (
                        <>
                          <span style={{ opacity: 0.4 }}>·</span>
                          <a
                            href={`/workflow/${gap.workflow_id}#${gap.rule_id}`}
                            style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}
                          >
                            View rule →
                          </a>
                        </>
                      )}

                      <span style={{
                        marginLeft: "auto",
                        padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a",
                      }}>
                        {gap.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
