import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";
import { X, ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { useStickToBottom } from "use-stick-to-bottom";
import { useChat } from "@/contexts/ChatContext";

export default function ChatPanel({ onClose }) {
  const { messages, setMessages, pendingContext, setPendingContext, pendingInput, setPendingInput } = useChat();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const { scrollRef, contentRef, scrollToBottom, isAtBottom } = useStickToBottom({
    initial: "instant",
  });

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Focus input when new context arrives
  useEffect(() => {
    if (pendingContext) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [pendingContext]);

  // Pre-fill input when pendingInput arrives
  useEffect(() => {
    if (pendingInput) {
      setInput(pendingInput);
      setPendingInput("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [pendingInput, setPendingInput]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const contextToSend = pendingContext;
    const newEntries = [];
    if (contextToSend) {
      newEntries.push({ role: "context", content: contextToSend });
      setPendingContext("");
    }
    newEntries.push({ role: "user", content: text });

    const newMessages = [...messages, ...newEntries];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    scrollToBottom("instant");

    const apiMessages = newMessages
      .filter((m) => m.role !== "assistant" || m.content)
      .map((m) => {
        if (m.role === "context") {
          return { role: "user", content: `[Contexto seleccionado]: "${m.content}"` };
        }
        return { role: m.role, content: m.content };
      });

    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText: contextToSend,
          messages: apiMessages,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error del servidor.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6);
            if (payload === "[DONE]") break;
            try {
              const data = JSON.parse(payload);
              if (data.error) {
                fullText = "Error: " + data.error;
              } else if (data.text) {
                fullText += data.text;
              }
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText };
                return updated;
              });
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: err.message || "Error de conexión. Intenta de nuevo.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-zinc-200 dark:border-zinc-800 lg:w-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Preguntale a la IA</h2>
        <div className="flex items-center gap-1">
          {(messages.length > 0 || pendingContext) && (
            <button
              onClick={() => { if (window.confirm("¿Borrar el historial del chat?")) { setMessages([]); setPendingContext(""); setInput(""); } }}
              aria-label="Limpiar chat"
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
        <div ref={contentRef} className="px-5 py-4">
          {messages.length === 0 && !pendingContext && (
            <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
              Seleccioná texto del artículo para preguntar
            </p>
          )}
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
                {msg.role === "context" ? (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-2.5 dark:border-blue-900/50 dark:bg-blue-950/30">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 dark:text-blue-400">
                      Contexto
                    </p>
                    <p className="mt-1 line-clamp-4 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                      &ldquo;{msg.content}&rdquo;
                    </p>
                  </div>
                ) : msg.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 text-[15px] leading-relaxed text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {msg.content}
                  </div>
                ) : (
                  <div className="agent-markdown max-w-none text-[15px] leading-[1.85] text-zinc-700 dark:text-zinc-300">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => {
                          if (href && href.startsWith("/")) {
                            return (
                              <Link href={href} className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 transition-colors hover:decoration-zinc-500 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:decoration-zinc-400">
                                {children}
                              </Link>
                            );
                          }
                          return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                        },
                      }}
                    >{msg.content}</ReactMarkdown>
                    {loading && i === messages.length - 1 && !msg.content && (
                      <span className="inline-flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Pensando...
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Scroll to bottom button */}
        {!isAtBottom && messages.length > 0 && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-zinc-200 bg-white p-2 shadow-md transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <ArrowDown size={14} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        )}
      </div>

      {/* Context + Input */}
      <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        {pendingContext && (
          <div className="relative mb-3 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-2.5 pr-8 dark:border-blue-900/50 dark:bg-blue-950/30">
            <button
              onClick={() => setPendingContext("")}
              className="absolute right-2 top-2 rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <X size={12} />
            </button>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 dark:text-blue-400">
              Contexto
            </p>
            <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
              &ldquo;{pendingContext}&rdquo;
            </p>
          </div>
        )}
        <div className="flex items-end gap-2">
          <TextareaAutosize
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribí tu pregunta..."
            disabled={loading}
            minRows={1}
            maxRows={5}
            className="flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[15px] leading-relaxed outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="mb-px flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-colors hover:bg-zinc-700 disabled:opacity-30 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
