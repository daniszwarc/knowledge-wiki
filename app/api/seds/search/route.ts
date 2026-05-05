import { query } from "@/lib/db";
import { embed } from "@/lib/ollama";

interface SearchRow {
  id: string;
  project_title: string;
  story_number: string | null;
  inc_ticket: string | null;
  programmer: string | null;
  requestor: string | null;
  date: string | null;
  department: string | null;
  business_requirements: string | null;
  it_design: string | null;
  similarity: number;
}

export async function POST(req: Request) {
  try {
    const { query: userQuery } = await req.json();
    if (!userQuery || typeof userQuery !== "string" || userQuery.trim().length < 20) {
      return Response.json({ error: "Query must be at least 20 characters." }, { status: 400 });
    }

    const vector = await embed(userQuery.trim());
    if (!vector || vector.length === 0) {
      return Response.json({ error: "Failed to generate embedding." }, { status: 502 });
    }
    const vectorStr = `[${vector.join(",")}]`;

    // Step 2: vector similarity search
    const rows = await query<SearchRow>(
      `SELECT
         id,
         project_title,
         story_number,
         inc_ticket,
         programmer,
         requestor,
         date,
         department,
         LEFT(business_requirements, 400) AS business_requirements,
         LEFT(it_design, 400) AS it_design,
         1 - (embedding <=> $1::vector) AS similarity
       FROM seds
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT 5`,
      [vectorStr]
    );

    const relevant = rows.filter((r) => r.similarity > 0.3);
    if (relevant.length === 0) {
      return Response.json({ results: [], message: "No similar issues found in past SEDs." });
    }

    // Step 3: LLM summaries in parallel
    const chatModel = process.env.OLLAMA_CHAT_MODEL ?? "gemma3:270m";
    const summaries = await Promise.all(
      relevant.map(async (r) => {
        try {
          const prompt =
            `Read this SED and write exactly 2 sentences with no labels or preamble:\n` +
            `Sentence 1: describe the issue in plain language.\n` +
            `Sentence 2: describe how it was fixed in plain language.\n` +
            `Do not write "The issue was:" or "How it was fixed:" or any other label.\n` +
            `Do not repeat the title. Just 2 plain sentences.\n\n` +
            `Title: ${r.project_title}\n` +
            `Business requirements: ${r.business_requirements ?? ""}\n` +
            `IT Design: ${r.it_design ?? ""}\n`;
          const llmRes = await fetch(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: chatModel, prompt, stream: false }),
          });
          if (!llmRes.ok) return null;
          const llmData = await llmRes.json();
          return (llmData.response as string | undefined)?.trim() ?? null;
        } catch {
          return null;
        }
      })
    );

    // Step 4: return results
    return Response.json({
      results: relevant.map((r, i) => ({
        id: r.id,
        story_number: r.story_number,
        project_title: r.project_title,
        inc_ticket: r.inc_ticket,
        programmer: r.programmer,
        date: r.date,
        similarity: r.similarity,
        summary: summaries[i],
        link: `/sed/${r.id}`,
      })),
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
