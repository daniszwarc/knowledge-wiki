import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Check, ChevronDown, Copy, FileCode2, MessageSquareDashed, Sparkles } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { getAllSlugs, getConceptBySlug, getAllConcepts, getConceptPreviews, getConceptsByCategory, getSearchIndex } from "@/lib/content";
import AskAI from "@/components/AskAI";
import LinkPreview from "@/components/LinkPreview";
import Mermaid from "@/components/Mermaid";
import { useChat } from "@/contexts/ChatContext";

export async function getStaticPaths() {
  const slugs = getAllSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const allSlugs = getAllSlugs();
  if (!allSlugs.includes(params.slug)) {
    return { notFound: true };
  }

  const concept = getConceptBySlug(params.slug);
  const allConcepts = getAllConcepts();

  const relatedConcepts = concept.related
    .map((slug) => allConcepts.find((c) => c.slug === slug))
    .filter(Boolean);

  const currentIndex = allConcepts.findIndex((c) => c.slug === params.slug);
  const prev = currentIndex > 0 ? allConcepts[currentIndex - 1] : null;
  const next =
    currentIndex < allConcepts.length - 1 ? allConcepts[currentIndex + 1] : null;

  const previews = getConceptPreviews();
  const categories = getConceptsByCategory();
  const searchIndex = getSearchIndex();

  return { props: { concept, relatedConcepts, prev, next, previews, categories, searchIndex } };
}

export default function ConceptPage({ concept, relatedConcepts, prev, next, previews }) {
  const articleRef = useRef(null);
  const llmMenuRef = useRef(null);
  const { openChat } = useChat();

  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [llmMenuOpen, setLlmMenuOpen] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!llmMenuRef.current?.contains(event.target)) {
        setLlmMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setLlmMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const markdownPath = `/${concept.slug}.md`;

  const getMarkdownUrl = useCallback(() => {
    if (typeof window === "undefined") {
      return markdownPath;
    }

    return new URL(markdownPath, window.location.origin).toString();
  }, [markdownPath]);

  const getLlmPrompt = useCallback(() => {
    return `Quiero entender y aplicar este artículo, "${concept.title}", en mi proyecto. Leé este Markdown y explicámelo con ejemplos prácticos de Next.js y Node.js: ${getMarkdownUrl()}`;
  }, [concept.title, getMarkdownUrl]);

  const handleCopyLLM = useCallback(async () => {
    const text = `# ${concept.title}\n\n${concept.description}\n\n${concept.content}`;
    await navigator.clipboard.writeText(text);
    setLlmMenuOpen(false);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [concept]);

  const handleOpenMarkdown = useCallback(() => {
    setLlmMenuOpen(false);
    const url = getMarkdownUrl();
    const opened = window.open(url, "_blank", "noopener,noreferrer");

    if (!opened) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    }
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
    {
      label: "Open Markdown content",
      hint: "Abrir el .md en una nueva pestaña",
      icon: <FileCode2 size={16} />,
      onClick: handleOpenMarkdown,
    },
    {
      label: "Copy content",
      hint: "Markdown + contexto del artículo",
      icon: copied ? <Check size={16} /> : <Copy size={16} />,
      onClick: handleCopyLLM,
    },
    {
      label: "Open in ChatGPT",
      hint: "Prompt con el enlace .md",
      icon: <Bot size={16} />,
      onClick: handleOpenInChatGPT,
    },
    {
      label: "Open in Claude",
      hint: "Prompt con el enlace .md",
      icon: <Sparkles size={16} />,
      onClick: handleOpenInClaude,
    },
  ];

  return (
    <>
      <Head>
        <title>{concept.title} — Creacionismo</title>
        <meta name="description" content={concept.description} />
        <meta property="og:title" content={`${concept.title} — Creacionismo`} />
        <meta property="og:description" content={concept.description} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="es_AR" />
        <meta property="article:section" content={concept.category} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${concept.title} — Creacionismo`} />
        <meta name="twitter:description" content={concept.description} />
      </Head>

      <article className="relative mx-auto max-w-2xl" ref={articleRef}>
        <AskAI containerRef={articleRef} onOpenChat={openChat} />
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          {concept.title}
        </h1>
        <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">
          {concept.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <div
            ref={llmMenuRef}
            className="relative inline-flex"
          >
            <div className="flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={handleCopyLLM}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
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
                onClick={() => setLlmMenuOpen((open) => !open)}
                className="px-2.5 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${llmMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {llmMenuOpen && (
              <div
                role="menu"
                className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-[19rem] overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950"
              >
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
                        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {item.label}
                        </span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                          {item.hint}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => openChat(concept.content)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Ask to chat
          </button>
        </div>

        <div className="prose mt-8">
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
                        border: isDark ? "1px solid #3f3f46" : "1px solid #e4e4e7",
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
                if (href.startsWith("/")) {
                  return (
                    <LinkPreview href={href} previews={previews}>
                      {children}
                    </LinkPreview>
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

        {relatedConcepts.length > 0 && (
          <nav className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <h2 className="text-lg font-medium text-zinc-400 dark:text-zinc-500">
              Conceptos relacionados
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {relatedConcepts.map((related) => (
                <li key={related.slug}>
                  <Link
                    href={`/${related.slug}`}
                    className="inline-block rounded-full border border-zinc-200 px-4 py-1.5 text-sm transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                  >
                    {related.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Prev / Next navigation */}
        <nav className="mt-12 flex items-stretch gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          {prev ? (
            <Link
              href={`/${prev.slug}`}
              className="flex flex-1 flex-col rounded-xl border border-zinc-200 p-4 transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                &larr; Anterior
              </span>
              <span className="mt-1 font-medium">
                {prev.question}
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {next ? (
            <Link
              href={`/${next.slug}`}
              className="flex flex-1 flex-col items-end rounded-xl border border-zinc-200 p-4 text-right transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Siguiente &rarr;
              </span>
              <span className="mt-1 font-medium">
                {next.question}
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </nav>
      </article>
    </>
  );
}
