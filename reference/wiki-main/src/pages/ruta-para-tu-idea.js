import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Link2,
  LoaderCircle,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { getAllConcepts, getConceptsByCategory, getSearchIndex } from "@/lib/content";
import { useChat } from "@/contexts/ChatContext";
import ArticleDrawer from "@/components/ArticleDrawer";

export async function getStaticProps() {
  const allConcepts = getAllConcepts();
  const concepts = allConcepts.map((c) => ({
    slug: c.slug,
    title: c.title,
    question: c.question || c.title,
    description: c.description,
    category: c.category,
  }));
  const categories = getConceptsByCategory();
  const searchIndex = getSearchIndex();
  return { props: { concepts, categories, searchIndex } };
}

const EXAMPLES = [
  "Una app para turnos de peluquerías con pagos online y recordatorios por WhatsApp",
  "Una plataforma de cursos online con login, suscripciones y videos privados",
  "Un marketplace donde vendedores publican productos y compradores pagan con tarjeta",
];

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function localMatch(idea, concepts) {
  const words = normalize(idea)
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  return concepts
    .map((c) => {
      const text = normalize(`${c.title} ${c.description} ${c.category}`);
      const hits = words.filter((w) => text.includes(w)).length;
      return { ...c, hits };
    })
    .filter((c) => c.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 21);
}

// --- URL encoding for shareable routes ---

function encodeRoute(result) {
  const compact = {
    s: (result.start || []).map((a) => a.slug),
    d: (result.deepen || []).map((a) => a.slug),
    q: result.questions || [],
    t: result.summary || "",
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
}

function decodeRoute(hash, concepts) {
  try {
    const json = decodeURIComponent(escape(atob(hash)));
    const { s = [], d = [], q = [], t = "" } = JSON.parse(json);
    const bySlug = Object.fromEntries(concepts.map((c) => [c.slug, c]));

    const hydrate = (slugs) =>
      slugs
        .filter((slug) => bySlug[slug])
        .map((slug) => ({ ...bySlug[slug], reason: bySlug[slug].description }));

    return {
      summary: t,
      start: hydrate(s),
      deepen: hydrate(d),
      questions: q,
      fromUrl: true,
    };
  } catch {
    return null;
  }
}

// --- Components ---

function ResultCard({ article, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(article.slug)}
      className="group flex flex-col justify-between rounded-xl border border-zinc-200 p-5 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
    >
      <div>
        <p className="text-[15px] font-medium leading-snug tracking-tight text-zinc-900 dark:text-zinc-100">
          {article.question}
        </p>
        {article.reason && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {article.reason}
          </p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
          {article.category}
        </span>
        <ArrowUpRight
          size={14}
          className="text-zinc-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-700 dark:group-hover:text-zinc-400"
        />
      </div>
    </button>
  );
}

export default function IdeaGuidePage({ concepts }) {
  const router = useRouter();
  const { chatOpen, openChat, openChatWithInput } = useChat();
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [drawerSlug, setDrawerSlug] = useState(null);
  const resultsRef = useRef(null);

  // Close drawer when chat opens
  useEffect(() => {
    if (chatOpen && drawerSlug) setDrawerSlug(null);
  }, [chatOpen, drawerSlug]);

  // Scroll lock on the main content area when drawer is open
  useEffect(() => {
    if (!drawerSlug) return;
    const main = document.querySelector("main");
    if (main) main.style.overflow = "hidden";
    return () => { if (main) main.style.overflow = ""; };
  }, [drawerSlug]);

  // Restore from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const decoded = decodeRoute(hash, concepts);
      if (decoded) setResult(decoded);
    }
  }, [concepts]);

  const updateHash = useCallback((res) => {
    const encoded = encodeRoute(res);
    window.history.replaceState(null, "", `${window.location.pathname}#${encoded}`);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = idea.trim();
    if (!text || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/idea-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: text }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Demasiadas solicitudes. Esperá un momento.");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        updateHash(data);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        return;
      }
      throw new Error();
    } catch {
      const matches = localMatch(text, concepts);
      if (matches.length > 0) {
        const fallback = {
          summary:
            "No pude conectar con la IA, pero estos artículos coinciden con tu idea por las palabras clave.",
          start: matches.slice(0, 12).map((c) => ({ ...c, reason: c.description })),
          deepen: matches.slice(12).map((c) => ({ ...c, reason: c.description })),
          questions: [],
        };
        setResult(fallback);
        updateHash(fallback);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        setError(
          "No encontré artículos relacionados. Probá describir tu idea con más detalle.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset() {
    setResult(null);
    setIdea("");
    router.replace({ pathname: router.pathname }, undefined, { shallow: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Head>
        <title>Ruta para tu idea — Creacionismo</title>
        <meta name="description" content="Describí tu idea de producto y te armamos una ruta de lectura con los conceptos que necesitás." />
        <meta property="og:title" content="Ruta para tu idea — Creacionismo" />
        <meta property="og:description" content="Describí tu idea de producto y te armamos una ruta de lectura con los conceptos que necesitás." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_AR" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Ruta para tu idea — Creacionismo" />
        <meta name="twitter:description" content="Describí tu idea de producto y te armamos una ruta de lectura con los conceptos que necesitás." />
      </Head>

      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <ArrowLeft size={14} />
            Inicio
          </Link>

          <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Ruta para tu idea
          </h1>
          <p className="mt-3 text-[17px] leading-[1.8] text-zinc-600 dark:text-zinc-400">
            Contanos tu idea de producto en dos o tres frases. Cruzamos tu
            descripción con los artículos de la wiki y te armamos una ruta de
            lectura para que arranques con las bases claras.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-4">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={4}
            placeholder="Ej: quiero hacer una app para restaurantes con reservas online, pagos y un panel para que el dueño vea métricas."
            className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
          />

          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setIdea(ex)}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-[12px] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
              >
                {ex.length > 60 ? ex.slice(0, 57) + "..." : ex}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || idea.trim().length < 10}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            {loading ? "Analizando..." : "Armar ruta"}
          </button>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </form>

        {/* Results */}
        {result && !loading && (
          <div ref={resultsRef} className="mt-12 space-y-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              {result.summary && (
                <p className="max-w-2xl text-[17px] leading-[1.8] text-zinc-600 dark:text-zinc-400">
                  {result.summary}
                </p>
              )}
              <button
                onClick={handleShare}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
              >
                {copied ? <Check size={14} /> : <Link2 size={14} />}
                {copied ? "Copiado" : "Compartir ruta"}
              </button>
            </div>

            {result.start?.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Empezá por acá
                </h2>
                <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
                  Los conceptos fundamentales para arrancar con tu idea.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {result.start.map((a) => (
                    <ResultCard key={a.slug} article={a} onOpen={setDrawerSlug} />
                  ))}
                </div>
              </section>
            )}

            {result.deepen?.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Para profundizar
                </h2>
                <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
                  Cuando tengas la base, estos te van a servir.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {result.deepen.map((a) => (
                    <ResultCard key={a.slug} article={a} onOpen={setDrawerSlug} />
                  ))}
                </div>
              </section>
            )}

            {result.questions?.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Preguntas para pensar antes de construir
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {result.questions.map((q) => (
                    <button
                      key={q}
                      onClick={() => openChatWithInput(q)}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-left text-[15px] leading-relaxed text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      <span>{q}</span>
                      <MessageSquare
                        size={14}
                        className="mt-1 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-700 dark:group-hover:text-zinc-400"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <button
              onClick={handleReset}
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              Probar con otra idea
            </button>
          </div>
        )}
      </div>

      {drawerSlug && result && (
        <ArticleDrawer
          articles={[...(result.start || []), ...(result.deepen || [])]}
          initialSlug={drawerSlug}
          onClose={() => setDrawerSlug(null)}
        />
      )}
    </>
  );
}
