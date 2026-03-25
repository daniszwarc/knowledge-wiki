import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, ExternalLink, FileCode2, MessageSquareDashed, Sparkles, X } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Mermaid from "@/components/Mermaid";

export default function ArticleDrawer({ articles, initialSlug, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, articles.findIndex((a) => a.slug === initialSlug)),
  );
  const [concept, setConcept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [copied, setCopied] = useState(false);
  const [llmMenuOpen, setLlmMenuOpen] = useState(false);
  const cacheRef = useRef({});
  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const llmMenuRef = useRef(null);

  const currentArticle = articles[currentIndex];

  // Slide-in on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Dark mode observer
  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Fetch article content
  useEffect(() => {
    const slug = currentArticle.slug;

    if (cacheRef.current[slug]) {
      setConcept(cacheRef.current[slug]);
      setLoading(false);
      scrollRef.current?.scrollTo(0, 0);
      return;
    }

    setLoading(true);
    fetch(`/api/articles/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        cacheRef.current[slug] = data;
        setConcept(data);
        setLoading(false);
        scrollRef.current?.scrollTo(0, 0);
      })
      .catch(() => setLoading(false));
  }, [currentArticle.slug]);

  const goNext = useCallback(() => {
    if (currentIndex < articles.length - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, articles.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Close LLM menu on outside click
  useEffect(() => {
    function handlePointerDown(e) {
      if (!llmMenuRef.current?.contains(e.target)) setLlmMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  // Reset LLM menu when navigating
  useEffect(() => {
    setLlmMenuOpen(false);
  }, [currentIndex]);

  const getMarkdownUrl = useCallback(() => {
    if (typeof window === "undefined") return `/${currentArticle.slug}.md`;
    return new URL(`/${currentArticle.slug}.md`, window.location.origin).toString();
  }, [currentArticle.slug]);

  const getLlmPrompt = useCallback(() => {
    const title = concept?.title || currentArticle.slug;
    return `Quiero entender y aplicar este artículo, "${title}", en mi proyecto. Leé este Markdown y explicámelo con ejemplos prácticos de Next.js y Node.js: ${getMarkdownUrl()}`;
  }, [concept, currentArticle.slug, getMarkdownUrl]);

  const handleCopyLLM = useCallback(async () => {
    if (!concept) return;
    const text = `# ${concept.title}\n\n${concept.description}\n\n${concept.content}`;
    await navigator.clipboard.writeText(text);
    setLlmMenuOpen(false);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [concept]);

  const handleOpenMarkdown = useCallback(() => {
    setLlmMenuOpen(false);
    const url = getMarkdownUrl();
    window.open(url, "_blank", "noopener,noreferrer");
  }, [getMarkdownUrl]);

  const handleOpenInChatGPT = useCallback(() => {
    const url = `https://chatgpt.com/?hints=search&q=${encodeURIComponent(getLlmPrompt())}`;
    setLlmMenuOpen(false);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [getLlmPrompt]);

  const handleOpenInClaude = useCallback(() => {
    const url = `https://claude.ai/new?q=${encodeURIComponent(getLlmPrompt())}`;
    setLlmMenuOpen(false);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [getLlmPrompt]);

  const llmMenuItems = [
    { label: "Open Markdown content", hint: "Abrir el .md en una nueva pestaña", icon: <FileCode2 size={16} />, onClick: handleOpenMarkdown },
    { label: "Copy content", hint: "Markdown + contexto del artículo", icon: copied ? <Check size={16} /> : <Copy size={16} />, onClick: handleCopyLLM },
    { label: "Open in ChatGPT", hint: "Prompt con el enlace .md", icon: <Bot size={16} />, onClick: handleOpenInChatGPT },
    { label: "Open in Claude", hint: "Prompt con el enlace .md", icon: <Sparkles size={16} />, onClick: handleOpenInClaude },
  ];

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, goNext, goPrev]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />

      {/* Prev arrow */}
      <button
        onClick={goPrev}
        disabled={currentIndex === 0}
        className={`relative z-10 mx-2 hidden shrink-0 rounded-full bg-white/90 p-3 text-zinc-500 shadow-lg transition-all hover:bg-white hover:text-zinc-900 disabled:opacity-0 sm:block dark:bg-zinc-800/90 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${visible ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
        aria-label="Artículo anterior"
      >
        <ChevronLeft size={22} />
      </button>

      {/* Center panel */}
      <div
        ref={panelRef}
        className={`relative flex h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-none bg-white shadow-2xl transition-all duration-200 ease-out sm:rounded-2xl dark:bg-zinc-950 ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        {/* Sticky header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {/* Mobile-only arrows */}
            <div className="flex items-center gap-1 sm:hidden">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-700 disabled:opacity-30 dark:text-zinc-500 dark:hover:text-zinc-300"
                aria-label="Artículo anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goNext}
                disabled={currentIndex === articles.length - 1}
                className="rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-700 disabled:opacity-30 dark:text-zinc-500 dark:hover:text-zinc-300"
                aria-label="Artículo siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
              {currentIndex + 1} / {articles.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href={`/${currentArticle.slug}`}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              Abrir completo
              <ExternalLink size={12} />
            </Link>
            <button
              onClick={handleClose}
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400" />
            </div>
          ) : concept ? (
            <article className="mx-auto max-w-prose">
              <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
                {concept.title}
              </h1>
              <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
                {concept.description}
              </p>

              <div className="mt-4" ref={llmMenuRef}>
                <div className="relative inline-flex">
                  <div className="flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={handleCopyLLM}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
                    >
                      {copied ? <Check size={14} /> : <MessageSquareDashed size={14} />}
                      {copied ? "Copied" : "Copy to LLM"}
                    </button>
                    <div className="w-px bg-zinc-200 dark:bg-zinc-700" />
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={llmMenuOpen}
                      aria-label="Open LLM actions"
                      onClick={() => setLlmMenuOpen((o) => !o)}
                      className="px-2.5 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
                    >
                      <ChevronDown size={16} className={`transition-transform ${llmMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {llmMenuOpen && (
                    <div role="menu" className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-[19rem] overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {llmMenuItems.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            onClick={item.onClick}
                            className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                          >
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-zinc-400 dark:text-zinc-500">
                              {item.icon}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
                              <span className="block text-xs text-zinc-500 dark:text-zinc-400">{item.hint}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="prose mt-6">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      const codeString = String(children).replace(/\n$/, "");
                      if (match && match[1] === "mermaid") {
                        return <Mermaid chart={codeString} />;
                      }
                      if (match) {
                        return (
                          <SyntaxHighlighter
                            style={isDark ? oneDark : oneLight}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              borderRadius: "0.5rem",
                              fontSize: "0.875rem",
                              border: isDark
                                ? "1px solid #3f3f46"
                                : "1px solid #e4e4e7",
                            }}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        );
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    a: ({ href, children }) => {
                      if (href && href.startsWith("/")) {
                        return (
                          <Link href={href} className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 transition-colors hover:decoration-zinc-500 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:decoration-zinc-400">
                            {children}
                          </Link>
                        );
                      }
                      return (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {concept.content}
                </ReactMarkdown>
              </div>
            </article>
          ) : null}
        </div>
      </div>

      {/* Next arrow */}
      <button
        onClick={goNext}
        disabled={currentIndex === articles.length - 1}
        className={`relative z-10 mx-2 hidden shrink-0 rounded-full bg-white/90 p-3 text-zinc-500 shadow-lg transition-all hover:bg-white hover:text-zinc-900 disabled:opacity-0 sm:block dark:bg-zinc-800/90 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${visible ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
        aria-label="Artículo siguiente"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
