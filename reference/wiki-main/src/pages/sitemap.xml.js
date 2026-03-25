import { getAllSlugs } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wiki.mormon.garden";

export async function getServerSideProps({ res }) {
  const slugs = getAllSlugs();
  const now = new Date().toISOString();

  const urls = [
    { loc: SITE_URL, priority: "1.0" },
    { loc: `${SITE_URL}/ruta-para-tu-idea`, priority: "0.8" },
    ...slugs.map((slug) => ({ loc: `${SITE_URL}/${slug}`, priority: "0.7" })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}
