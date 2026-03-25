import { getAllSlugs, getRawConceptBySlug } from "@/lib/content";

export default function handler(req, res) {
  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;

  if (!slug || !getAllSlugs().includes(slug)) {
    res.status(404).send("Not Found");
    return;
  }

  const markdown = getRawConceptBySlug(slug);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send(markdown);
}
