"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

export default function SedsPage() {
  const [me, setMe] = useState<{ id: string; email: string; role: string } | null>(null);
  const [seds, setSeds] = useState<Sed[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSlow, setChatSlow] = useState(false);
  const chatSlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setMe(data); });
  }, []);

  useEffect(() => {
    fetch("/api/seds")
      .then((r) => r.json())
      .then((data: Sed[]) => setSeds(Array.isArray(data) ? data : []));
  }, []);

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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: q }],
          workflowId: null,
          context: null,
          sedSearch: true,
        }),
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

  const recentSeds = [...seds]
    .sort((a, b) => {
      const da = a.date ?? a.created_at ?? "";
      const db = b.date ?? b.created_at ?? "";
      return db.localeCompare(da);
    })
    .slice(0, 10);

  const grouped: Record<string, Sed[]> = {};
  for (const s of seds) {
    const dept = s.department ?? "Other";
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(s);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      <Sidebar me={me} />

      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "32px 32px 64px", maxWidth: 960, width: "100%" }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--foreground)", marginBottom: 8, lineHeight: 1.3 }}>
              Small Enhancement Documents
            </h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, maxWidth: 520 }}>
              Search past enhancements to find similar issues and solutions.
            </p>
          </div>

          {/* Discovery chat */}
          <div style={{
            marginBottom: 40,
            padding: 20,
            borderRadius: 12,
            border: "1px solid var(--card-border)",
            background: "var(--sidebar-bg)",
          }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", marginBottom: 12 }}>
              Search SEDs
            </p>
            <form onSubmit={handleChat} style={{ display: "flex", gap: 8 }}>
              <input
                className="search-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="e.g. Was there a SED dealing with PHP 8.4 issues?"
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
                      Searching the SED archive
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
                        {chatResponse.replace(/(?<!\]\()\/sed\/[0-9a-f-]{36}/g, (m) => `[${m}](${m})`)}
                      </ReactMarkdown>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Recent SEDs table */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap" }}>
                Recent SEDs
              </h2>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--card-border)", margin: 0 }} />
            </div>

            {seds.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted-light)" }}>No SEDs uploaded yet.</p>
            ) : (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                      <th style={{ textAlign: "left", padding: "6px 12px 6px 0", fontSize: 11, fontWeight: 600, color: "var(--muted-light)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Story</th>
                      <th style={{ textAlign: "left", padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted-light)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Project title</th>
                      <th style={{ textAlign: "left", padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted-light)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Programmer</th>
                      <th style={{ textAlign: "left", padding: "6px 0 6px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted-light)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSeds.map((s) => (
                      <tr
                        key={s.id}
                        style={{ borderBottom: "1px solid var(--card-border)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--card-hover-bg)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "none"; }}
                      >
                        <td style={{ padding: "10px 12px 10px 0" }}>
                          <a href={`/sed/${s.id}`} style={{ color: "var(--muted)", textDecoration: "none", fontSize: 12, fontFamily: "var(--font-geist-mono), monospace" }}>
                            {s.story_number ?? s.inc_ticket ?? s.ticket_number ?? "—"}
                          </a>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <a href={`/sed/${s.id}`} style={{ color: "var(--foreground)", textDecoration: "none", fontWeight: 500 }}>
                            {s.project_title}
                          </a>
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--muted)" }}>
                          {s.programmer ?? "—"}
                        </td>
                        <td style={{ padding: "10px 0 10px 12px", color: "var(--muted-light)", fontSize: 12 }}>
                          {s.date ? s.date.substring(0, 10) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!showAll && seds.length > 10 && (
                  <button
                    onClick={() => setShowAll(true)}
                    style={{
                      marginTop: 12, fontSize: 12, color: "var(--muted)",
                      background: "none", border: "none", cursor: "pointer",
                      padding: "4px 0", textDecoration: "underline", textUnderlineOffset: 2,
                    }}
                  >
                    View all {seds.length} SEDs
                  </button>
                )}
              </>
            )}
          </div>

          {/* All SEDs grouped by department (expanded view) */}
          {showAll && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap" }}>
                  All SEDs by department
                </h2>
                <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--card-border)", margin: 0 }} />
                <button
                  onClick={() => setShowAll(false)}
                  style={{ fontSize: 11, color: "var(--muted-light)", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Collapse
                </button>
              </div>

              {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dept, items]) => (
                <div key={dept} style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>
                      {dept}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--muted-light)" }}>({items.length})</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <tbody>
                      {items.map((s) => (
                        <tr
                          key={s.id}
                          style={{ borderBottom: "1px solid var(--card-border)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--card-hover-bg)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "none"; }}
                        >
                          <td style={{ padding: "9px 12px 9px 0", width: 120 }}>
                            <a href={`/sed/${s.id}`} style={{ color: "var(--muted)", textDecoration: "none", fontSize: 12, fontFamily: "var(--font-geist-mono), monospace" }}>
                              {s.story_number ?? s.inc_ticket ?? s.ticket_number ?? "—"}
                            </a>
                          </td>
                          <td style={{ padding: "9px 12px" }}>
                            <a href={`/sed/${s.id}`} style={{ color: "var(--foreground)", textDecoration: "none", fontWeight: 500 }}>
                              {s.project_title}
                            </a>
                          </td>
                          <td style={{ padding: "9px 12px", color: "var(--muted)", width: 160 }}>
                            {s.programmer ?? "—"}
                          </td>
                          <td style={{ padding: "9px 0 9px 12px", color: "var(--muted-light)", fontSize: 12, width: 100 }}>
                            {s.date ? s.date.substring(0, 10) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
