"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

interface Me {
  id: string;
  email: string;
  role: string;
}

interface AuditEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  changed_by: string;
  changed_at: string;
  previous_value: unknown;
  new_value: unknown;
}

interface AuditResponse {
  entries: AuditEntry[];
  total: number;
  page: number;
  limit: number;
}

const ACTION_BADGE: Record<string, React.CSSProperties> = {
  created:   { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" },
  validated: { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" },
  updated:   { background: "#fef9c3", color: "#a16207", border: "1px solid #fde047" },
  flagged:   { background: "#fef9c3", color: "#a16207", border: "1px solid #fde047" },
  deleted:   { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" },
};

function actionBadge(action: string): React.CSSProperties {
  return ACTION_BADGE[action.toLowerCase()] ?? {
    background: "var(--card-hover-bg)", color: "var(--muted)", border: "1px solid var(--card-border)",
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  }) + ", " + new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export default function AuditPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Filters
  const [tableFilter, setTableFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");

  const LIMIT = 50;

  // Auth check
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data: Me | null) => {
        if (!data) {
          router.replace("/login");
          return;
        }
        if (data.role !== "admin" && data.role !== "developer") {
          router.replace("/");
          return;
        }
        setMe(data);
        setAuthReady(true);
      });
  }, [router]);

  const fetchEntries = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tableFilter) params.set("table", tableFilter);
    if (actionFilter) params.set("action", actionFilter);
    if (userFilter) params.set("user", userFilter);
    if (fromFilter) params.set("from", fromFilter);
    if (toFilter) params.set("to", toFilter);
    params.set("page", String(page));

    fetch(`/api/audit?${params}`)
      .then((r) => r.json())
      .then((data: AuditResponse) => {
        setEntries(data.entries ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tableFilter, actionFilter, userFilter, fromFilter, toFilter, page]);

  useEffect(() => {
    if (authReady) fetchEntries();
  }, [authReady, fetchEntries]);

  function resetFilters() {
    setTableFilter("");
    setActionFilter("");
    setUserFilter("");
    setFromFilter("");
    setToFilter("");
    setPage(1);
  }

  function applyFilters() {
    setPage(1);
    fetchEntries();
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const from = (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, total);

  if (!authReady) {
    return null;
  }

  const selectStyle: React.CSSProperties = {
    padding: "7px 10px", fontSize: 12, borderRadius: 7,
    border: "1px solid var(--card-border)", background: "var(--background)",
    color: "var(--foreground)", cursor: "pointer", outline: "none",
  };

  const inputStyle: React.CSSProperties = {
    ...selectStyle, minWidth: 140,
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* Sidebar */}
      <Sidebar me={me} />

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

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
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Audit Log</span>
          <span style={{
            marginLeft: "auto",
            fontSize: 11, fontWeight: 500,
            padding: "2px 8px", borderRadius: 99,
            background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a",
          }}>
            Admin only
          </span>
        </div>

        <div style={{ padding: "28px 32px 64px", maxWidth: 1200, width: "100%" }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginBottom: 6 }}>
              Audit log
            </h1>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              All recorded changes to rules, workflows, articles, and users.
            </p>
          </div>

          {/* Filters */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
            marginBottom: 20,
            padding: "14px 16px",
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: 10,
          }}>
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="">All tables</option>
              <option value="rules">rules</option>
              <option value="articles">articles</option>
              <option value="workflows">workflows</option>
              <option value="users">users</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="">All actions</option>
              <option value="created">created</option>
              <option value="updated">updated</option>
              <option value="deleted">deleted</option>
              <option value="validated">validated</option>
              <option value="flagged">flagged</option>
            </select>

            <input
              type="text"
              placeholder="User (partial match)"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              style={inputStyle}
            />

            <input
              type="date"
              value={fromFilter}
              onChange={(e) => setFromFilter(e.target.value)}
              style={inputStyle}
              title="From"
            />
            <span style={{ fontSize: 11, color: "var(--muted-light)" }}>→</span>
            <input
              type="date"
              value={toFilter}
              onChange={(e) => setToFilter(e.target.value)}
              style={inputStyle}
              title="To"
            />

            <button
              onClick={applyFilters}
              style={{
                padding: "7px 14px", fontSize: 12, borderRadius: 7,
                background: "var(--foreground)", color: "var(--background)",
                border: "none", cursor: "pointer", fontWeight: 500,
              }}
            >
              Apply
            </button>

            <button
              onClick={resetFilters}
              style={{
                padding: "7px 12px", fontSize: 12, borderRadius: 7,
                background: "none", color: "var(--muted)",
                border: "1px solid var(--card-border)", cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  height: 40, borderRadius: 6,
                  background: "var(--card-hover-bg)", opacity: 0.5 - i * 0.04,
                }} />
              ))}
            </div>
          )}

          {/* Table */}
          {!loading && entries.length === 0 && (
            <div style={{
              padding: "48px 24px", textAlign: "center",
              border: "1px solid var(--card-border)", borderRadius: 12, color: "var(--muted)",
            }}>
              <p style={{ fontSize: 14, fontWeight: 500 }}>No entries found</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Try adjusting the filters above.</p>
            </div>
          )}

          {!loading && entries.length > 0 && (
            <div style={{ border: "1px solid var(--card-border)", borderRadius: 10, overflow: "hidden" }}>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr 100px 100px 90px 32px",
                gap: 0,
                padding: "9px 16px",
                background: "var(--sidebar-bg)",
                borderBottom: "1px solid var(--card-border)",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
                textTransform: "uppercase", color: "var(--muted)",
              }}>
                <span>When</span>
                <span>User</span>
                <span>Action</span>
                <span>Table</span>
                <span>Record ID</span>
                <span></span>
              </div>

              {/* Rows */}
              {entries.map((entry, idx) => {
                const isExpanded = expanded.has(entry.id);
                const isLast = idx === entries.length - 1;
                return (
                  <div
                    key={entry.id}
                    style={{
                      borderBottom: isLast ? "none" : "1px solid var(--card-border)",
                      background: "var(--card-bg)",
                    }}
                  >
                    {/* Main row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "180px 1fr 100px 100px 90px 32px",
                        alignItems: "center",
                        gap: 0,
                        padding: "10px 16px",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                      onClick={() => toggleExpanded(entry.id)}
                    >
                      <span style={{ color: "var(--muted)", fontSize: 11 }}>{formatDate(entry.changed_at)}</span>
                      <span style={{ color: "var(--foreground)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                        {entry.changed_by}
                      </span>
                      <span>
                        <span style={{
                          ...actionBadge(entry.action),
                          fontSize: 10, fontWeight: 600, padding: "2px 8px",
                          borderRadius: 99, textTransform: "capitalize",
                        }}>
                          {entry.action}
                        </span>
                      </span>
                      <span>
                        <span style={{
                          fontSize: 10, fontWeight: 500, padding: "2px 8px",
                          borderRadius: 99, background: "var(--sidebar-bg)",
                          border: "1px solid var(--card-border)", color: "var(--muted)",
                        }}>
                          {entry.table_name}
                        </span>
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted-light)", fontFamily: "monospace" }}>
                        {truncate(entry.record_id, 8)}
                      </span>
                      <span style={{
                        fontSize: 11, color: "var(--muted-light)", textAlign: "center",
                        transition: "transform 0.15s",
                        display: "block",
                        transform: isExpanded ? "rotate(180deg)" : "none",
                      }}>
                        ▾
                      </span>
                    </div>

                    {/* Expanded diff */}
                    {isExpanded && (
                      <div style={{
                        padding: "0 16px 14px",
                        background: "var(--sidebar-bg)",
                        borderTop: "1px solid var(--card-border)",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 12 }}>
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
                              Previous value
                            </p>
                            <pre style={{
                              fontSize: 11, color: "var(--muted)", background: "var(--card-bg)",
                              border: "1px solid var(--card-border)", borderRadius: 6,
                              padding: "10px 12px", overflow: "auto", maxHeight: 200,
                              margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all",
                            }}>
                              {entry.previous_value == null
                                ? "—"
                                : JSON.stringify(entry.previous_value, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#15803d", marginBottom: 6 }}>
                              New value
                            </p>
                            <pre style={{
                              fontSize: 11, color: "var(--foreground)", background: "#f0fdf4",
                              border: "1px solid #bbf7d0", borderRadius: 6,
                              padding: "10px 12px", overflow: "auto", maxHeight: 200,
                              margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all",
                            }}>
                              {entry.new_value == null
                                ? "—"
                                : JSON.stringify(entry.new_value, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && total > 0 && (
            <div style={{
              marginTop: 16,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: 12, color: "var(--muted)",
            }}>
              <span>
                Showing {from}–{to} of {total} entries
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: "6px 14px", fontSize: 12, borderRadius: 7,
                    border: "1px solid var(--card-border)", background: "var(--card-bg)",
                    color: page === 1 ? "var(--muted-light)" : "var(--foreground)",
                    cursor: page === 1 ? "default" : "pointer",
                  }}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={to >= total}
                  style={{
                    padding: "6px 14px", fontSize: 12, borderRadius: 7,
                    border: "1px solid var(--card-border)", background: "var(--card-bg)",
                    color: to >= total ? "var(--muted-light)" : "var(--foreground)",
                    cursor: to >= total ? "default" : "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
