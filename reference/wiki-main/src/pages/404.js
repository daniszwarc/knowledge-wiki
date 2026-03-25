import Link from "next/link";
import Head from "next/head";
import { getConceptsByCategory, getSearchIndex } from "@/lib/content";

export async function getStaticProps() {
  const categories = getConceptsByCategory();
  const searchIndex = getSearchIndex();
  return { props: { categories, searchIndex } };
}

export default function NotFound() {
  return (
    <>
      <Head>
        <title>404 — Página no encontrada</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-6xl font-semibold text-zinc-200 dark:text-zinc-800">404</p>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Esta página no existe.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          Volver al inicio
        </Link>
      </div>
    </>
  );
}
