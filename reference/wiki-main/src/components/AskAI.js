import { useState, useEffect, useRef, useCallback } from "react";

export default function AskAI({ containerRef, onOpenChat }) {
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const buttonRef = useRef(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length < 3) return;

    const container = containerRef?.current;
    if (container && !container.contains(selection.anchorNode)) return;

    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects());
    const containerRect = container.getBoundingClientRect();
    const pad = 4.9;

    const lineHeight = 40;
    const filtered = rects.filter(
      (r) => r.width > 0 && r.height > 0 && r.height < lineHeight,
    );

    if (filtered.length === 0) return;

    const merged = [];
    for (const r of filtered) {
      const top = r.top - containerRect.top - pad;
      const left = r.left - containerRect.left;
      const width = r.width;
      const height = r.height + pad * 2;
      const last = merged[merged.length - 1];

      if (last && Math.abs(last.top - top) < 2) {
        const right = Math.max(last.left + last.width, left + width);
        last.left = Math.min(last.left, left);
        last.width = right - last.left;
        last.height = Math.max(last.height, height);
      } else {
        merged.push({ top, left, width, height });
      }
    }

    const lastRect = filtered[filtered.length - 1];

    setSelectedText(text);
    setOverlays(merged);
    setPosition({
      top: lastRect.bottom - containerRect.top + 8,
      left: lastRect.left - containerRect.left + lastRect.width / 2,
    });

    selection.removeAllRanges();
  }, [containerRef]);

  const dismiss = useCallback(() => {
    setSelectedText("");
    setPosition(null);
    setOverlays([]);
  }, []);

  const handleClickOutside = useCallback(
    (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        dismiss();
      }
    },
    [dismiss],
  );

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleMouseUp, handleClickOutside]);

  const handleOpen = () => {
    onOpenChat(selectedText);
    dismiss();
  };

  if (!selectedText || !position) return null;

  return (
    <>
      {overlays.map((o, i) => (
        <div
          key={i}
          className="ai-highlight pointer-events-none absolute"
          style={{
            top: o.top,
            left: o.left,
            width: o.width,
            height: o.height,
          }}
        />
      ))}
      <div
        ref={buttonRef}
        style={{ top: position.top, left: position.left }}
        className="absolute z-50 -translate-x-1/2"
      >
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-lg transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.4V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.6c2.9-1.1 5-4 5-7.4a8 8 0 0 0-8-8z" />
            <path d="M10 22h4" />
          </svg>
          Preguntar a la IA
        </button>
      </div>
    </>
  );
}
