"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatPanelProps {
  workflowId?: string;
  sedId?: string;
  context?: string;
  title?: string;
  subtitle?: string;
  suggestedPrompts?: string[];
}

export function ChatPanel({
  workflowId,
  sedId,
  context,
  title = "Ask a question",
  subtitle,
  suggestedPrompts,
}: ChatPanelProps) {
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (isThinking && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isThinking]);

  async function handleChat(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const next = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(next);
    setChatLoading(true);
    setIsThinking(true);

    let assistantText = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          workflowId: workflowId ?? null,
          sedId: sedId ?? null,
          context,
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("text/plain")) {
        const body = await res.text();
        const isHtml = body.trim().startsWith("<");
        const errorMsg = isHtml
          ? "Session expired — please refresh the page."
          : (() => { try { return JSON.parse(body).error ?? "Something went wrong."; } catch { return "Something went wrong."; } })();
        setIsThinking(false);
        setChatMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      setIsThinking(false);
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
      setIsThinking(false);
    }
  }

  async function handleSuggestedPrompt(prompt: string) {
    if (chatLoading) return;
    const userMsg = prompt;
    setChatInput("");
    const next = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(next);
    setChatLoading(true);
    setIsThinking(true);
    let assistantText = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          workflowId: workflowId ?? null,
          context,
          sedId: sedId ?? null,
        }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("text/plain")) {
        const body = await res.text();
        const isHtml = body.trim().startsWith("<");
        const errorMsg = isHtml
          ? "Session expired — please refresh the page."
          : (() => { try { return JSON.parse(body).error ?? "Something went wrong."; } catch { return "Something went wrong."; } })();
        setIsThinking(false);
        setChatMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
        return;
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      setIsThinking(false);
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
      setIsThinking(false);
    }
  }

  return (
    <div
      style={{
        width: 340,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--sidebar-bg)",
        borderLeft: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 16px 14px",
          borderBottom: "1px solid var(--sidebar-border)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--foreground)",
              marginBottom: 2,
            }}
          >
            {title}
          </p>
          {subtitle && (
            <p style={{ fontSize: 11, color: "var(--muted)" }}>{subtitle}</p>
          )}
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
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "88%",
                padding: "9px 12px",
                borderRadius: 10,
                fontSize: 12,
                lineHeight: 1.65,
                background:
                  msg.role === "user"
                    ? "var(--foreground)"
                    : "var(--card-bg)",
                color:
                  msg.role === "user"
                    ? "var(--background)"
                    : "var(--foreground)",
                border:
                  msg.role === "assistant"
                    ? "1px solid var(--card-border)"
                    : "none",
              }}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p
                        style={{ margin: "0 0 6px", fontSize: 12, lineHeight: 1.65 }}
                      >
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ fontWeight: 600 }}>{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul
                        style={{
                          marginLeft: 16,
                          marginBottom: 6,
                          listStyleType: "disc",
                        }}
                      >
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol style={{ marginLeft: 16, marginBottom: 6 }}>
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li style={{ marginBottom: 2, fontSize: 12 }}>{children}</li>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        style={{
                          color: "var(--foreground)",
                          fontWeight: 500,
                          textDecoration: "underline",
                          textUnderlineOffset: 2,
                        }}
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {(
                    msg.content ||
                    (chatLoading && i === chatMessages.length - 1 ? "…" : "")
                  ).replace(
                    /(?<!\]\()(\/(workflow|article)\/[0-9a-f-]{36})/g,
                    "[$1]($1)"
                  )}
                </ReactMarkdown>
              ) : (
                msg.content ||
                (chatLoading && i === chatMessages.length - 1 ? "…" : "")
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
        {isThinking && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginTop: 8 }}>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--muted)", display: "inline-block", animation: "bounce 1.2s infinite ease-in-out", animationDelay: "0s" }} />
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--muted)", display: "inline-block", animation: "bounce 1.2s infinite ease-in-out", animationDelay: "0.2s" }} />
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--muted)", display: "inline-block", animation: "bounce 1.2s infinite ease-in-out", animationDelay: "0.4s" }} />
            </div>
            <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Thinking…</span>
          </div>
        )}
        <div ref={chatBottomRef} />
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-6px); opacity: 1; }
          }
        `}</style>
      </div>

      {/* Suggested prompt chips */}
      {chatMessages.length === 0 && suggestedPrompts && suggestedPrompts.length > 0 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: "12px 16px",
          borderTop: "0.5px solid var(--sidebar-border)",
        }}>
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSuggestedPrompt(prompt)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                border: "0.5px solid var(--card-border)",
                borderRadius: 99,
                background: "var(--sidebar-bg)",
                color: "var(--muted)",
                cursor: "pointer",
                lineHeight: 1.4,
                textAlign: "left",
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: "10px 12px 14px",
          borderTop: "1px solid var(--sidebar-border)",
        }}
      >
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
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 7,
              border: "none",
              background: "var(--foreground)",
              color: "var(--background)",
              cursor:
                chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
              opacity: chatLoading || !chatInput.trim() ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
