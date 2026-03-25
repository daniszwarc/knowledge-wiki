import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useChat } from "@/contexts/ChatContext";
import ChatPanel from "@/components/ChatPanel";
import SearchDialog from "@/components/SearchDialog";
import * as LucideIcons from "lucide-react";

const { ChevronDown } = LucideIcons;

function resolveIcon(name) {
  if (!name) return null;
  // Convert kebab-case to PascalCase: "message-square" → "MessageSquare"
  const pascal = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  return LucideIcons[pascal] || null;
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

export default function Layout({ children, categories, currentConcept, searchIndex }) {
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const isHome = router.pathname === "/";
  const { chatOpen, openChat, closeChat } = useChat();
  const mainRef = useRef(null);

  const activeSlug = currentConcept?.slug || null;
  const [openCategory, setOpenCategory] = useState(currentConcept?.category || null);

  // Auto-open current article's category
  useEffect(() => {
    if (currentConcept?.category) {
      setOpenCategory(currentConcept.category);
    }
  }, [currentConcept?.category]);

  // Scroll main to top on route change
  useEffect(() => {
    const handleRouteChange = () => {
      mainRef.current?.scrollTo(0, 0);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router]);

  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Cmd+K to open search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  }

  const hasSidebar = categories && categories.length > 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => setMobileMenuOpen(false);
    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router]);

  return (
    <div className="flex h-screen flex-col bg-white text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            {hasSidebar && (
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Abrir menú"
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 lg:hidden"
              >
                {mobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="8" x2="20" y2="8" />
                    <line x1="4" y1="16" x2="20" y2="16" />
                  </svg>
                )}
              </button>
            )}
            <Link href="/" className="font-serif text-xl font-bold tracking-tight text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300">
              Creacionismo
            </Link>
          </div>
          <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span className="hidden text-xs sm:inline">Buscar</span>
            <kbd className="hidden rounded border border-zinc-200 px-1 py-0.5 text-[10px] dark:border-zinc-700 sm:inline">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => chatOpen ? closeChat() : openChat("")}
            aria-label="Alternar chat"
            className={`rounded-full p-2 transition-colors ${
              chatOpen
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </button>
          <button
            onClick={toggleDarkMode}
            aria-label="Alternar modo oscuro"
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {hasSidebar && mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-zinc-200 bg-white pb-6 pt-20 pl-4 pr-2 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
            <Link
              href="/ruta-para-tu-idea"
              className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            >
              <LucideIcons.Sparkles size={13} className="shrink-0" />
              Tengo una idea de producto
            </Link>
            <nav className="flex flex-col gap-px">
              {categories.map((group) => {
                const Icon = resolveIcon(group.icon);
                const isOpen = openCategory === group.category;
                return (
                  <div key={group.category}>
                    <button
                      onClick={() => setOpenCategory(isOpen ? null : group.category)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                        isOpen
                          ? "font-medium text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      {Icon && <Icon size={14} className={`shrink-0 ${isOpen ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}`} />}
                      <span className="flex-1 text-left">{group.category}</span>
                      <ChevronDown size={12} className={`text-zinc-400 transition-transform dark:text-zinc-500 ${isOpen ? "" : "-rotate-90"}`} />
                    </button>
                    {isOpen && (
                      <div className="ml-5 mt-0.5 flex flex-col gap-px border-l border-zinc-200 pl-3 dark:border-zinc-700">
                        {group.concepts.map((c) => (
                          <Link
                            key={c.slug}
                            href={`/${c.slug}`}
                            className={`rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                              activeSlug === c.slug
                                ? "font-medium text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                            }`}
                          >
                            {c.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar (desktop) */}
        {hasSidebar && (
          <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-zinc-200 py-6 pl-4 pr-2 dark:border-zinc-800 lg:block">
            <Link
              href="/ruta-para-tu-idea"
              className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            >
              <LucideIcons.Sparkles size={13} className="shrink-0" />
              Tengo una idea de producto
            </Link>
            <nav className="flex flex-col gap-px">
              {categories.map((group) => {
                const Icon = resolveIcon(group.icon);
                const isOpen = openCategory === group.category;
                return (
                  <div key={group.category}>
                    <button
                      onClick={() => setOpenCategory(isOpen ? null : group.category)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                        isOpen
                          ? "font-medium text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      {Icon && <Icon size={14} className={`shrink-0 ${isOpen ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}`} />}
                      <span className="flex-1 text-left">{group.category}</span>
                      <ChevronDown size={12} className={`text-zinc-400 transition-transform dark:text-zinc-500 ${isOpen ? "" : "-rotate-90"}`} />
                    </button>
                    {isOpen && (
                      <div className="ml-5 mt-0.5 flex flex-col gap-px border-l border-zinc-200 pl-3 dark:border-zinc-700">
                        {group.concepts.map((c) => (
                          <Link
                            key={c.slug}
                            href={`/${c.slug}`}
                            className={`rounded-md px-2 py-1 text-[12px] transition-colors ${
                              activeSlug === c.slug
                                ? "font-medium text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                            }`}
                          >
                            {c.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto px-6 py-12">
          {children}
        </main>

        {/* Right panel (chat) */}
        {chatOpen && <ChatPanel onClose={closeChat} />}
      </div>

      <SearchDialog
        categories={categories}
        searchIndex={searchIndex}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
