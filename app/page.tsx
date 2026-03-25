"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [grouped, setGrouped] = useState<GroupedWorkflows>({});
  const [departments, setDepartments] = useState<string[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    fetch("/api/workflows")
      .then((r) => r.json())
      .then((data: Workflow[]) => {
        const g: GroupedWorkflows = {};
        for (const w of data) {
          if (!g[w.department]) g[w.department] = [];
          g[w.department].push(w);
        }
        setWorkflows(data);
        setGrouped(g);
        const depts = Object.keys(g).sort();
        setDepartments(depts);
        const open: Record<string, boolean> = {};
        depts.forEach((d) => (open[d] = true));
        setOpenDepts(open);
      });
  }, []);

  function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    if (searchQ.trim()) router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  }

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

        {/* Search */}
        <div style={{ padding: "12px 12px 10px", borderBottom: "1px solid var(--sidebar-border)" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = (e.currentTarget.elements.namedItem("sidebar-q") as HTMLInputElement).value.trim();
              if (val) router.push(`/search?q=${encodeURIComponent(val)}`);
            }}
            style={{ position: "relative" }}
          >
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted-light)", pointerEvents: "none", display: "flex" }}>
              <SearchIcon />
            </span>
            <input
              name="sidebar-q"
              className="search-input"
              placeholder="Search processes"
              style={{
                width: "100%",
                paddingLeft: 30,
                paddingRight: 36,
                paddingTop: 7,
                paddingBottom: 7,
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <kbd style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, background: "var(--card-hover-bg)", border: "1px solid var(--card-border)", padding: "2px 5px", borderRadius: 4, fontFamily: "var(--font-geist-mono)", color: "var(--muted-light)", pointerEvents: "none" }}>
              ⌘K
            </kbd>
          </form>
        </div>

        {/* Department nav */}
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {departments.map((dept) => (
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
                <span style={{ fontSize: 15, opacity: 0.7 }}>{DEPT_ICONS[dept] ?? "◈"}</span>
                <span>{dept}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 400, color: "var(--muted-light)" }}>
                  {grouped[dept]?.length ?? 0}
                </span>
                <ChevronIcon rotated={openDepts[dept]} />
              </button>

              {openDepts[dept] && (
                <div style={{ marginLeft: 16, paddingLeft: 12, borderLeft: "1px solid var(--card-border)", marginBottom: 4 }}>
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
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: "12px 16px 56px",
          borderTop: "1px solid var(--sidebar-border)",
          position: "sticky",
          bottom: 0,
          background: "var(--sidebar-bg)",
          zIndex: 1,
        }}>
          <a href="/experts" style={{ display: "block", fontSize: 12, color: "var(--muted)", textDecoration: "none", padding: "5px 0" }}>
            Subject matter experts
          </a>
          <a href="/gaps" style={{ display: "block", fontSize: 12, color: "var(--muted)", textDecoration: "none", padding: "5px 0" }}>
            Flagged gaps
          </a>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* Sticky top bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "var(--background)",
          borderBottom: "1px solid var(--sidebar-border)",
          padding: "12px 32px",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 520 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted-light)", pointerEvents: "none" }}>
                <SearchIcon />
              </span>
              <input
                id="search-input"
                className="search-input"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search rules, workflows, policies…"
                style={{
                  width: "100%",
                  paddingLeft: 36,
                  paddingRight: 16,
                  paddingTop: 9,
                  paddingBottom: 9,
                  fontSize: 14,
                  borderRadius: 8,
                }}
              />
            </div>
          </form>
          <span style={{ fontSize: 12, color: "var(--muted-light)" }}>{workflows.length} workflows</span>
        </div>

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
                fontSize: 13,
                color: "var(--foreground)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}>
                {chatResponse}
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

                  return (
                    <a
                      key={w.id}
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

function SearchIcon() {
  return (
    <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ display: "block" }}>
      <circle cx={11} cy={11} r={8} />
      <path d="m21 21-4.35-4.35" />
    </svg>
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
