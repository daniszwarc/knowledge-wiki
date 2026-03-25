import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "content");

const CATEGORY_ORDER = [
  "Fundamentos",
  "Internet",
  "Interfaz",
  "Comunicación",
  "Datos",
  "Usuarios",
  "Archivos",
  "Procesamiento",
  "Tiempo real",
  "Arquitectura",
  "Infraestructura",
  "Versionado",
  "Testing",
  "Automatización",
  "Pagos",
  "Inteligencia artificial",
  "Analytics",
  "Marketing",
  "Producto",
  "Ecosistema",
];

export function getAllSlugs() {
  const files = fs.readdirSync(contentDirectory);
  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getConceptBySlug(slug) {
  const filePath = path.join(contentDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title,
    description: data.description,
    category: data.category || "General",
    order: data.order || 99,
    question: data.question || "",
    related: data.related || [],
    icon: data.icon || null,
    content,
  };
}

export function getRawConceptBySlug(slug) {
  const filePath = path.join(contentDirectory, `${slug}.md`);
  return fs.readFileSync(filePath, "utf8");
}

export function getAllConcepts() {
  const slugs = getAllSlugs();
  return slugs
    .map((slug) => {
      const { content, ...meta } = getConceptBySlug(slug);
      return meta;
    })
    .sort((a, b) => {
      const catA = CATEGORY_ORDER.indexOf(a.category);
      const catB = CATEGORY_ORDER.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      return a.order - b.order;
    });
}

export function getConceptPreviews() {
  const slugs = getAllSlugs();
  const previews = {};
  for (const slug of slugs) {
    const concept = getConceptBySlug(slug);
    previews[slug] = {
      title: concept.title,
      description: concept.description,
    };
  }
  return previews;
}

export function getSearchIndex() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => {
    const concept = getConceptBySlug(slug);
    // Strip markdown syntax for plain-text search
    const plainContent = concept.content
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#*`\[\]()>_~|\\-]/g, "")
      .replace(/\n+/g, " ")
      .trim();
    return {
      slug: concept.slug,
      body: plainContent,
    };
  });
}

export function getConceptsByCategory() {
  const concepts = getAllConcepts();
  const grouped = {};
  for (const concept of concepts) {
    if (!grouped[concept.category]) {
      grouped[concept.category] = { concepts: [], icon: null };
    }
    grouped[concept.category].concepts.push(concept);
    if (!grouped[concept.category].icon && concept.icon) {
      grouped[concept.category].icon = concept.icon;
    }
  }
  // Categories in CATEGORY_ORDER first, then any others alphabetically
  const ordered = CATEGORY_ORDER.filter((cat) => grouped[cat]);
  const remaining = Object.keys(grouped)
    .filter((cat) => !CATEGORY_ORDER.includes(cat))
    .sort();
  return [...ordered, ...remaining].map((cat) => ({
    category: cat,
    icon: grouped[cat].icon,
    concepts: grouped[cat].concepts,
  }));
}
