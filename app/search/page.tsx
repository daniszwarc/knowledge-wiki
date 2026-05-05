"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface RuleResult {
  type: "rule";
  rule_id: string;
  workflow_id: string;
  workflow_name: string;
  department: string;
  summary: string;
  detail: string | null;
  rule_type: string;
  confidence: "high" | "medium" | "low";
  stakeholder_validated: boolean;
  owner_name: string | null;
  rrf_score: number;
}

interface ArticleResult {
  type: "article";
  article_id: string;
  title: string;
  department: string | null;
  snippet: string;
  rrf_score: number;
  is_corporate?: boolean;
  company_name?: string | null;
  company_number?: number | null;
}

interface SedResult {
  type: "sed";
  id: string;
  ticket_number: string;
  project_title: string;
  department: string | null;
  snippet: string;
  rrf_score: number;
  is_corporate?: boolean;
  company_name?: string | null;
  company_number?: number | null;
}

type SearchResult = RuleResult | ArticleResult | SedResult;


function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(false);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        setResults(Array.isArray(data) ? (data as SearchResult[]) : []);
        setSearched(true);
      })
      .finally(() => setLoading(false));
  }, [q]);

  function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    if (searchInput.trim()) router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
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
        <a href="/" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
          <span>←</span> Home
        </a>

        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 560 }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted-light)", pointerEvents: "none" }}>
              <SearchIcon />
            </span>
            <input
              className="search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search rules, workflows, policies…"
              style={{ width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 9, paddingBottom: 9, fontSize: 14, borderRadius: 8 }}
            />
          </div>
        </form>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, width: "100%", padding: "32px 32px 64px" }}>

        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          {q ? (
            <>
              <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
                Results for &ldquo;{q}&rdquo;
              </h1>
              {searched && (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  {results.length === 0 ? "No results found." : `${results.length} result${results.length !== 1 ? "s" : ""} ranked by relevance`}
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: 14, color: "var(--muted)" }}>Enter a search query above.</p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: 96, borderRadius: 10,
                border: "1px solid var(--card-border)",
                background: "var(--card-hover-bg)",
                opacity: 0.5,
              }} />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && searched && results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map((r, idx) =>
              r.type === "article" ? (
                <a
                  key={r.article_id}
                  href={`/article/${r.article_id}`}
                  className="workflow-card"
                  style={{ display: "block", padding: 18, borderRadius: 10, textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-light)", minWidth: 18, textAlign: "center" }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8" }}>
                      Article
                    </span>
                    {r.department && (
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, border: "1px solid var(--card-border)", color: "var(--muted-light)", background: "none" }}>
                        {r.department}
                      </span>
                    )}
                    {r.is_corporate && (
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: "#E6F1FB", color: "#185FA5", border: "1px solid #C0D7F3" }}>Corporate</span>
                    )}
                    {!r.is_corporate && r.company_name && (
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, border: "1px solid var(--card-border)", color: "var(--muted-light)", background: "none" }}>
                        {r.company_number != null ? `${r.company_number} - ${r.company_name}` : r.company_name}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 6, lineHeight: 1.45 }}>
                    {r.title}
                  </p>
                  {r.snippet && (
                    <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {r.snippet.replace(/[#*`]/g, "")}
                    </p>
                  )}
                  <div style={{ marginTop: 8, fontSize: 10, color: "var(--muted-light)", opacity: 0.5, fontFamily: "var(--font-geist-mono)" }}>
                    score {r.rrf_score.toFixed(4)}
                  </div>
                </a>
              ) : (
                <a
                  key={r.rule_id}
                  href={`/workflow/${r.workflow_id}#${r.rule_id}`}
                  className="workflow-card"
                  style={{ display: "block", padding: 18, borderRadius: 10, textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-light)", minWidth: 18, textAlign: "center" }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, border: "1px solid var(--card-border)", background: "var(--sidebar-bg)", color: "var(--muted)" }}>
                      {r.workflow_name}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, border: "1px solid var(--card-border)", color: "var(--muted-light)", background: "none", textTransform: "capitalize" }}>
                      {r.rule_type}
                    </span>
                    {!r.stakeholder_validated && (
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                        Unvalidated
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)", marginBottom: r.detail ? 5 : 8, lineHeight: 1.45 }}>
                    {r.summary}
                  </p>
                  {r.detail && (
                    <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {r.detail}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--muted-light)" }}>
                    {r.owner_name && (
                      <span>Owner: <span style={{ color: "var(--muted)", fontWeight: 500 }}>{r.owner_name}</span></span>
                    )}
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{r.department}</span>
                    <span style={{ marginLeft: "auto", opacity: 0.5, fontFamily: "var(--font-geist-mono)", fontSize: 10 }}>
                      score {r.rrf_score.toFixed(4)}
                    </span>
                  </div>
                </a>
              )
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && results.length === 0 && (
          <div style={{
            padding: "40px 24px", textAlign: "center",
            border: "1px solid var(--card-border)", borderRadius: 12,
            color: "var(--muted)",
          }}>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No matching rules or articles found</p>
            <p style={{ fontSize: 12 }}>Try different keywords, or <a href="/" style={{ color: "var(--foreground)" }}>browse all workflows</a>.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}

function SearchIcon() {
  return (
    <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ display: "block" }}>
      <circle cx={11} cy={11} r={8} />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
