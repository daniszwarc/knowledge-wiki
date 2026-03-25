import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";

export default function SearchDialog({ categories, searchIndex, open, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const router = useRouter();

  const bodyMap = {};
  if (searchIndex) {
    for (const item of searchIndex) {
      bodyMap[item.slug] = item.body;
    }
  }

  const allConcepts = categories
    ? categories.flatMap((g) =>
        g.concepts.map((c) => ({ ...c, category: g.category })),
      )
    : [];

  const filtered = query.trim()
    ? allConcepts.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.question.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (bodyMap[c.slug] && bodyMap[c.slug].toLowerCase().includes(q))
        );
      })
    : allConcepts;

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(`/${filtered[selectedIndex].slug}`);
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [filtered, selectedIndex, router, onClose],
  );

  // Global Cmd+K / Ctrl+K
  useEffect(() => {
    function handleGlobal(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
    }
    document.addEventListener("keydown", handleGlobal);
    return () => document.removeEventListener("keydown", handleGlobal);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-zinc-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar conceptos..."
            className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <kbd className="hidden rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-700 sm:inline">
            ESC
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-zinc-400">
              Sin resultados
            </p>
          ) : (
            filtered.map((c, i) => (
              <button
                key={c.slug}
                onClick={() => {
                  router.push(`/${c.slug}`);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors ${
                  i === selectedIndex
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : ""
                }`}
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {c.title}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {c.category}
                  {c.description ? ` — ${c.description}` : ""}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
