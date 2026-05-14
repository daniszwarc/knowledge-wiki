import { query } from "@/lib/db";
import { embed } from "@/lib/ollama";
import { NextRequest } from "next/server";

interface SearchRow {
  id: string;
  project_title: string;
  story_number: string | null;
  inc_ticket: string | null;
  programmer: string | null;
  date: string | null;
  business_requirements: string | null;
  it_design: string | null;
  similarity: number;
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { query: userQuery } = await req.json();
  if (!userQuery || typeof userQuery !== "string" || userQuery.trim().length < 20) {
    return new Response(JSON.stringify({ error: "Query must be at least 20 characters." }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: object) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      }

      try {
        send({ type: "status", message: "Searching past SEDs..." });

        const vector = await embed(userQuery.trim());
        if (!vector || vector.length === 0) {
          send({ type: "error", message: "Failed to generate embedding." });
          controller.close();
          return;
        }
        const vectorStr = `[${vector.join(",")}]`;

        const rows = await query<SearchRow>(
          `SELECT id, project_title, story_number, inc_ticket, programmer, date,
                  LEFT(business_requirements, 400) AS business_requirements,
                  LEFT(it_design, 400) AS it_design,
                  1 - (embedding <=> $1::vector) AS similarity
           FROM seds
           WHERE embedding IS NOT NULL
           ORDER BY embedding <=> $1::vector
           LIMIT 5`,
          [vectorStr]
        );

        const relevant = rows.filter((r) => r.similarity > 0.15);

        if (relevant.length === 0) {
          send({ type: "empty", message: "No similar issues found in past SEDs." });
          controller.close();
          return;
        }

        send({
          type: "results",
          results: relevant.map((r) => ({
            id: r.id,
            story_number: r.story_number,
            project_title: r.project_title,
            inc_ticket: r.inc_ticket,
            programmer: r.programmer,
            date: r.date,
            similarity: r.similarity,
            summary: null,
            link: `/sed/${r.id}`,
          })),
        });

        send({ type: "status", message: "Generating summaries..." });

        const chatModel = process.env.OLLAMA_CHAT_MODEL ?? "qwen3.6";
        const summaryMap = new Map<string, string>();

        for (const r of relevant) {
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

            const llmRes = await fetch(`${process.env.OLLAMA_BASE_URL}/chat/completions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.LLM_API_KEY}`,
              },
              body: JSON.stringify({
                model: chatModel,
                messages: [{ role: "user", content: prompt }],
                stream: false,
                chat_template_kwargs: { enable_thinking: false },
              }),
            });

            if (llmRes.ok) {
              const llmData = await llmRes.json();
              const summary = (llmData.choices?.[0]?.message?.content as string | undefined)?.trim() ?? null;
              if (summary) summaryMap.set(r.id, summary);
              send({ type: "summary", id: r.id, summary });
            } else {
              send({ type: "summary", id: r.id, summary: null });
            }
          } catch {
            send({ type: "summary", id: r.id, summary: null });
          }
        }

        try {
          send({ type: "status", message: "Summarising findings..." });

          const sedsContext = relevant
            .filter((r) => summaryMap.has(r.id))
            .map((r) => `- "${r.project_title}" (/sed/${r.id}): ${summaryMap.get(r.id)}`)
            .join("\n");

          const synthesisPrompt =
            `A user searched for: "${userQuery}"\n\n` +
            `Here are the relevant SEDs found:\n${sedsContext}\n\n` +
            `Write 2-3 sentences in a conversational tone identifying patterns across these findings. ` +
            `Reference specific SEDs by title in plain text (no markdown). ` +
            `Do not write a preamble like "Here is a summary". Be direct and helpful.`;

          const synthRes = await fetch(`${process.env.OLLAMA_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.LLM_API_KEY}`,
            },
            body: JSON.stringify({
              model: chatModel,
              messages: [{ role: "user", content: synthesisPrompt }],
              stream: true,
              chat_template_kwargs: { enable_thinking: false },
            }),
          });

          if (synthRes.ok && synthRes.body) {
            const synthReader = synthRes.body.getReader();
            const synthDecoder = new TextDecoder();
            let synthBuffer = "";
            let synthDone = false;

            while (!synthDone) {
              const { done, value } = await synthReader.read();
              if (done) break;
              synthBuffer += synthDecoder.decode(value, { stream: true });
              const lines = synthBuffer.split("\n");
              synthBuffer = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const dataStr = line.slice(6).trim();
                if (dataStr === "[DONE]") { synthDone = true; break; }
                try {
                  const chunk = JSON.parse(dataStr);
                  const text = chunk.choices?.[0]?.delta?.content as string | undefined;
                  if (text) send({ type: "synthesis_chunk", text });
                } catch { /* ignore malformed chunks */ }
              }
            }
          }
        } catch { /* synthesis failure must not break the response */ }

        send({ type: "done" });
      } catch {
        send({ type: "error", message: "Internal server error." });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
    },
  });
}
