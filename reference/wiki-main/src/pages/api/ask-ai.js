import OpenAI from "openai";
import { getAllConcepts } from "@/lib/content";
import { rateLimit } from "@/lib/rate-limit";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let articlesCache = null;

function getArticlesCatalog() {
  if (!articlesCache) {
    articlesCache = getAllConcepts().map((c) => `- [${c.title}](/${c.slug}) — ${c.category}`).join("\n");
  }
  return articlesCache;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ok } = rateLimit(req);
  if (!ok) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Esperá un momento." });
  }

  const { selectedText, messages, articleTitle } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "Missing messages" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        {
          role: "system",
          content: `Eres un asistente educativo de una wiki sobre tecnología y desarrollo web llamada "Creacionismo".${articleTitle ? ` El usuario está leyendo un artículo llamado "${articleTitle}".` : ""}${selectedText ? ` Seleccionó el siguiente texto del artículo:\n\n"${selectedText}"` : ""}

Responde de forma clara, concisa y en español.

REGLAS PARA RECOMENDAR ARTÍCULOS:
- SOLO podés recomendar artículos que estén en el catálogo de abajo. NUNCA inventes links ni uses URLs externas como Wikipedia.
- Cuando recomiendes un artículo, copiá EXACTAMENTE el link Markdown del catálogo. Por ejemplo: [APIs y REST](/apis-rest)
- No recomiendes artículos si no son relevantes a la pregunta.

CATÁLOGO DE ARTÍCULOS DISPONIBLES:
${getArticlesCatalog()}`,
        },
        ...messages,
      ],
      max_tokens: 500,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.write(`data: ${JSON.stringify({ error: "Error al consultar la IA" })}\n\n`);
    res.end();
  }
}
