"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";

interface Sed {
  id: string;
  ticket_number: string;
  project_title: string;
  department: string | null;
  story_number: string | null;
  inc_ticket: string | null;
  programmer: string | null;
  requestor: string | null;
  date: string | null;
  created_at: string;
}

interface SearchResult {
  id: string;
  story_number: string | null;
  project_title: string;
  inc_ticket: string | null;
  programmer: string | null;
  date: string | null;
  similarity: number;
  summary: string | null;
  link: string;
}

function similarityLabel(score: number): { label: string; color: string } {
  if (score > 0.7) return { label: "Strong match", color: "#4ade80" };
  if (score >= 0.5) return { label: "Possible match", color: "#f59e0b" };
  return { label: "Weak match", color: "var(--muted-light)" };
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function SedsPage() {
  const [me, setMe] = useState<{ id: string; email: string; role: string } | null>(null);
  const [recentSeds, setRecentSeds] = useState<Sed[]>([]);
  const [queryText, setQueryText] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setMe(data); });
  }, []);

  useEffect(() => {
    fetch("/api/seds")
      .then((r) => r.json())
      .then((data: Sed[]) => {
        if (!Array.isArray(data)) return;
        const sorted = [...data].sort((a, b) => {
          const da = a.created_at ?? "";
          const db = b.created_at ?? "";
          return db.localeCompare(da);
        });
        setRecentSeds(sorted.slice(0, 5));
      });
  }, []);

  async function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    if (queryText.trim().length < 20 || searching) return;
    setSearching(true);
    setResults(null);
    setEmptyMessage(null);
    setSearchError(null);
    try {
      const res = await fetch("/api/seds/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Search failed.");
        return;
      }
      if (data.results && data.results.length > 0) {
        setResults(data.results);
      } else {
        setResults([]);
        setEmptyMessage(data.message ?? "No similar issues found in past SEDs.");
      }
    } catch {
      setSearchError("Could not reach the search service. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  const canSearch = queryText.trim().length >= 20 && !searching;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      <Sidebar me={me} />

      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "40px 40px 80px", maxWidth: 800, width: "100%" }}>

          {/* Hero */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--foreground)", marginBottom: 10, lineHeight: 1.3 }}>
              Find past solutions
            </h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, maxWidth: 560 }}>
              Describe the issue you are working on. The wiki will search past SEDs for similar problems and how they were resolved.
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ marginBottom: 40 }}>
            <textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              rows={3}
              placeholder="e.g. PHP is throwing an error when validating numeric fields in PO entry"
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 14,
                borderRadius: 10,
                border: "1px solid var(--card-border)",
                background: "var(--sidebar-bg)",
                color: "var(--foreground)",
                resize: "vertical",
                lineHeight: 1.6,
                boxSizing: "border-box",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <div style={{ marginTop: 10 }}>
              <button
                type="submit"
                disabled={!canSearch}
                style={{
                  padding: "9px 20px",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: "none",
                  background: "var(--foreground)",
                  color: "var(--background)",
                  cursor: canSearch ? "pointer" : "not-allowed",
                  opacity: canSearch ? 1 : 0.4,
                }}
              >
                {searching ? "Searching past SEDs…" : "Search past SEDs"}
              </button>
              {queryText.trim().length > 0 && queryText.trim().length < 20 && (
                <span style={{ marginLeft: 12, fontSize: 12, color: "var(--muted-light)" }}>
                  {20 - queryText.trim().length} more character{20 - queryText.trim().length !== 1 ? "s" : ""} needed
                </span>
              )}
            </div>
          </form>

          {/* Error */}
          {searchError && (
            <div style={{ marginBottom: 32, padding: "12px 16px", borderRadius: 8, background: "var(--sidebar-bg)", border: "1px solid var(--card-border)", fontSize: 13, color: "var(--muted)" }}>
              {searchError}
            </div>
          )}

          {/* Results */}
          {results !== null && results.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap" }}>
                  Results
                </h2>
                <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--card-border)", margin: 0 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {results.map((r) => {
                  const { label, color } = similarityLabel(r.similarity);
                  const [line1, line2] = r.summary
                    ? r.summary.split(/(?<=\.)\s+/)
                    : [null, null];
                  return (
                    <div
                      key={r.id}
                      style={{
                        border: "0.5px solid var(--card-border)",
                        borderRadius: 10,
                        padding: 20,
                        background: "var(--sidebar-bg)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
                            {[r.story_number, r.inc_ticket].filter(Boolean).join(" · ") || "—"}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 500,
                            color, border: `1px solid ${color}`,
                            borderRadius: 4, padding: "1px 6px",
                            opacity: 0.85,
                          }}>
                            {label}
                          </span>
                        </div>
                        <a
                          href={r.link}
                          style={{
                            fontSize: 12, fontWeight: 500,
                            color: "var(--foreground)",
                            textDecoration: "none",
                            padding: "4px 12px",
                            borderRadius: 6,
                            border: "1px solid var(--card-border)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-hover-bg)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                        >
                          View SED
                        </a>
                      </div>

                      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)", marginBottom: 10, lineHeight: 1.4 }}>
                        {r.project_title}
                      </p>

                      {r.summary ? (
                        <div style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.7, marginBottom: 12 }}>
                          {line1 && (
                            <p style={{ margin: "0 0 4px" }}>
                              <span style={{ color: "var(--muted)", fontSize: 13 }}>The issue was: </span>
                              {line1.replace(/\.$/, "")}.
                            </p>
                          )}
                          {line2 && (
                            <p style={{ margin: 0 }}>
                              <span style={{ color: "var(--muted)", fontSize: 13 }}>How it was fixed: </span>
                              {line2.replace(/\.$/, "")}.
                            </p>
                          )}
                          {!line1 && !line2 && (
                            <p style={{ margin: 0 }}>{r.summary}</p>
                          )}
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: "var(--muted-light)", marginBottom: 12, fontStyle: "italic" }}>
                          Summary unavailable.
                        </p>
                      )}

                      <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                        {r.programmer ? <>Programmer: {r.programmer}</> : null}
                        {r.programmer && r.date ? " · " : null}
                        {r.date ? `Date: ${formatDate(r.date)}` : null}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {results !== null && results.length === 0 && (
            <div style={{ marginBottom: 48, padding: "20px 24px", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--sidebar-bg)" }}>
              <p style={{ fontSize: 14, color: "var(--foreground)", fontWeight: 500, marginBottom: 6 }}>
                {emptyMessage ?? "No similar issues found in past SEDs."}
              </p>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                This may be a new type of issue — consider documenting it as a SED once resolved.
              </p>
            </div>
          )}

          {/* Recently added SEDs */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap" }}>
                Recently added SEDs
              </h2>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--card-border)", margin: 0 }} />
            </div>
            {recentSeds.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted-light)" }}>No SEDs uploaded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recentSeds.map((s) => (
                  <a
                    key={s.id}
                    href={`/sed/${s.id}`}
                    style={{
                      display: "flex", alignItems: "baseline", gap: 10,
                      padding: "9px 0",
                      borderBottom: "1px solid var(--card-border)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-hover-bg)"; e.currentTarget.style.paddingLeft = "6px"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.paddingLeft = "0"; }}
                  >
                    <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono), monospace", flexShrink: 0 }}>
                      {s.story_number ?? s.inc_ticket ?? s.ticket_number ?? "—"}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.project_title}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>
                      {s.programmer ?? "—"}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted-light)", flexShrink: 0 }}>
                      {s.date ? s.date.substring(0, 10) : "—"}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
