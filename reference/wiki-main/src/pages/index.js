import { useState, useMemo } from "react";
import Link from "next/link";
import Head from "next/head";
import { getConceptsByCategory, getSearchIndex } from "@/lib/content";
import { Search, ArrowUpRight, Sparkles, Shuffle, icons } from "lucide-react";

function resolveIcon(name) {
  if (!name) return null;
  const pascal = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  return icons[pascal] || null;
}

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export async function getStaticProps() {
  const categories = getConceptsByCategory();
  const searchIndex = getSearchIndex();
  const concepts = categories.flatMap((g) =>
    g.concepts.map((c) => ({
      slug: c.slug,
      title: c.title,
      question: c.question,
      description: c.description,
      category: g.category,
    })),
  );
  return { props: { concepts, categories, searchIndex } };
}

export default function Home({ concepts, categories }) {
  const [search, setSearch] = useState("");

  const query = normalize(search.trim());

  const filteredCategories = useMemo(() => {
    if (!query) return categories;
    return categories
      .map((g) => ({
        ...g,
        concepts: g.concepts.filter(
          (c) =>
            normalize(c.question).includes(query) ||
            normalize(c.title).includes(query) ||
            normalize(c.description).includes(query),
        ),
      }))
      .filter((g) => g.concepts.length > 0);
  }, [categories, query]);

  function goRandom() {
    const pick = concepts[Math.floor(Math.random() * concepts.length)];
    window.location.href = `/${pick.slug}`;
  }

  return (
    <>
      <Head>
        <title>Creacionismo — Cómo funcionan las aplicaciones</title>
        <meta name="description" content="Explicaciones simples sobre cómo funcionan las aplicaciones y los conceptos que te ayudan a usar mejor la IA al programar." />
        <meta property="og:title" content="Creacionismo — Cómo funcionan las aplicaciones" />
        <meta property="og:description" content="Explicaciones simples sobre cómo funcionan las aplicaciones y los conceptos que te ayudan a usar mejor la IA al programar." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_AR" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Creacionismo — Cómo funcionan las aplicaciones" />
        <meta name="twitter:description" content="Explicaciones simples sobre cómo funcionan las aplicaciones y los conceptos que te ayudan a usar mejor la IA al programar." />
      </Head>

      <div className="mx-auto max-w-6xl">
        {/* Blog-style intro */}
        <div className="mb-14 max-w-2xl">
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Cómo funcionan las aplicaciones
          </h1>

          <div className="mt-5 flex items-center gap-2 text-sm">
            <span className="text-zinc-400 dark:text-zinc-500">Creado por</span>
            <a
              href="https://x.com/mormonnegro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-blue-500 dark:text-blue-400"
            >
              <img
                src="https://pbs.twimg.com/profile_images/1981087949811781632/tmMNA-0f_400x400.jpg"
                alt="mormonnegro"
                className="h-5 w-5 rounded-full"
              />
              Mormon Negro
            </a>
          </div>

          <div className="mt-4 space-y-4 text-[17px] leading-[1.8] text-zinc-600 dark:text-zinc-400">
            <p>
              Si usás herramientas de inteligencia artificial para programar (ChatGPT, Claude, Copilot), seguramente notaste que cuanto mejor entendés lo que estás haciendo, mejores resultados te dan. No hace falta ser experto, pero sí entender las piezas fundamentales.
            </p>
            <p>
              Esta guía cubre los conceptos que aparecen una y otra vez cuando construís una aplicación: desde qué es un frontend hasta cómo funcionan los pagos, la inteligencia artificial o el deploy. Organizados por tema, para que puedas ir directo a lo que necesitás.
            </p>
            <p>
              Si tenés una idea de producto, el planificador te arma una ruta de lectura personalizada. Y si te surge una duda mientras leés, el chat de IA te puede ayudar en el momento.
            </p>
            <p>
              No asumimos que sabés programar. Solo que tenés curiosidad.
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/ruta-para-tu-idea"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <Sparkles size={14} />
              Tengo una idea de producto
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-lg border border-zinc-200 bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            />
          </div>
          <button
            onClick={goRandom}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <Shuffle size={14} />
            Sorprendeme
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-16">
          {filteredCategories.map((group) => (
            <section key={group.category}>
              <div className="mb-5 flex items-center gap-3">
                {(() => {
                  const Icon = resolveIcon(group.icon);
                  return Icon ? <Icon size={18} className="text-zinc-400 dark:text-zinc-500" /> : null;
                })()}
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {group.category}
                </h2>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {group.concepts.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.concepts.map((concept) => (
                  <Link
                    key={concept.slug}
                    href={`/${concept.slug}`}
                    className="group flex flex-col justify-between rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    <div>
                      <p className="text-[15px] font-medium leading-snug tracking-tight text-zinc-900 dark:text-zinc-100">
                        {concept.question}
                      </p>
                      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                        {concept.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                        {concept.title}
                      </span>
                      <ArrowUpRight
                        size={14}
                        className="text-zinc-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-700 dark:group-hover:text-zinc-400"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="rounded-xl border border-zinc-200 py-20 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              Sin resultados. Probá con otra búsqueda.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
