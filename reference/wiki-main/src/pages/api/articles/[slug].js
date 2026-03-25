import { getAllSlugs, getConceptBySlug } from "@/lib/content";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slug } = req.query;
  const allSlugs = getAllSlugs();

  if (!allSlugs.includes(slug)) {
    return res.status(404).json({ error: "Not found" });
  }

  const concept = getConceptBySlug(slug);

  res.status(200).json({
    slug: concept.slug,
    title: concept.title,
    description: concept.description,
    category: concept.category,
    content: concept.content,
  });
}
