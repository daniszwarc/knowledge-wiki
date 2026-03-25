import OpenAI from "openai";
import { getAllConcepts } from "@/lib/content";
import { rateLimit } from "@/lib/rate-limit";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ok } = rateLimit(req);
  if (!ok) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Esperá un momento." });
  }

  const { idea } = req.body;
  if (!idea?.trim() || idea.trim().length < 10) {
    return res.status(400).json({ error: "Describí tu idea con un poco más de detalle." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "Sin API key" });
  }

  const concepts = getAllConcepts();
  const catalog = concepts
    .map((c) => `${c.slug} | ${c.title} — ${c.description}`)
    .join("\n");

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Sos un asistente que ayuda a personas con ideas de producto a entender qué conceptos técnicos necesitan aprender.

Catálogo de artículos (slug | título — descripción):
${catalog}

Dada la idea del usuario, elegí los artículos más relevantes. Devolvé JSON:
{
  "summary": "1-2 oraciones sobre qué toca esta idea a nivel técnico",
  "start": [{"slug": "...", "reason": "Por qué leer esto primero (1 frase, específica a la idea)"}],
  "deepen": [{"slug": "...", "reason": "Por qué es útil después (1 frase)"}],
  "questions": ["Pregunta estratégica que conviene responder antes de construir"]
}

- "start": 9-12 artículos fundamentales
- "deepen": 6-9 artículos para después
- "questions": exactamente 4 preguntas
- SOLO slugs del catálogo
- Español casual, vos argentino
- Razones específicas a la idea, no genéricas`,
        },
        { role: "user", content: idea.trim() },
      ],
      max_tokens: 2500,
    });

    const data = JSON.parse(completion.choices[0].message.content);
    const bySlug = Object.fromEntries(concepts.map((c) => [c.slug, c]));

    const hydrate = (items) =>
      (items || [])
        .filter((item) => bySlug[item.slug])
        .map((item) => ({
          slug: bySlug[item.slug].slug,
          title: bySlug[item.slug].title,
          question: bySlug[item.slug].question || bySlug[item.slug].title,
          description: bySlug[item.slug].description,
          category: bySlug[item.slug].category,
          reason: item.reason,
        }));

    return res.json({
      summary: data.summary || "",
      start: hydrate(data.start),
      deepen: hydrate(data.deepen),
      questions: (data.questions || []).filter(Boolean).slice(0, 4),
    });
  } catch (err) {
    console.error("Idea guide error:", err);
    return res.status(500).json({ error: "Error al generar la ruta" });
  }
}
