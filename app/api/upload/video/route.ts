import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { parseVTT, vttToPlainText } from "@/lib/vtt";

const ollamaBase = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const chatModel = process.env.OLLAMA_CHAT_MODEL ?? "qwen3:6b";
const llmApiKey = process.env.LLM_API_KEY ?? "ollama";

async function llmChat(prompt: string): Promise<string> {
  const res = await fetch(`${ollamaBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${llmApiKey}`,
    },
    body: JSON.stringify({
      model: chatModel,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      chat_template_kwargs: { enable_thinking: false },
    }),
  });
  if (!res.ok) throw new Error(`LLM error: ${res.statusText}`);
  const data = await res.json();
  return ((data.choices?.[0]?.message?.content as string | undefined) ?? "").trim();
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["editor", "admin", "developer"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const title = (formData.get("title") as string | null)?.trim();
  const department = (formData.get("department") as string | null)?.trim();
  let embedUrl = (formData.get("embed_url") as string | null)?.trim() ?? "";
  const vttFile = formData.get("srt_file") as File | null;
  const isCorporate = formData.get("is_corporate") === "true";
  const companyId = (formData.get("company_id") as string | null) || null;

  if (!title || !department || !embedUrl || !vttFile) {
    return NextResponse.json(
      { error: "title, department, embed_url, and srt_file are required" },
      { status: 400 }
    );
  }

  // Extract src from full iframe embed code if pasted
  const srcMatch = embedUrl.match(/src=["']([^"']+)["']/);
  if (srcMatch) embedUrl = srcMatch[1];

  const vttText = await vttFile.text();
  const cues = parseVTT(vttText);
  const plainText = vttToPlainText(vttText);

  const transcriptWithTimestamps = cues
    .map((c) => `[${c.start}|${Math.round(c.startSeconds)}s] ${c.text}`)
    .join("\n")
    .slice(0, 6000);

  // Generate overview, TOC, and content (sequential to avoid overwhelming the LLM)
  let overview = "";
  try {
    overview = await llmChat(
      `In 2-3 sentences, summarize what this video covers based on its transcript. Be concise and informative. Do not add any preamble.\n\nTranscript:\n${plainText.slice(0, 4000)}`
    );
  } catch {
    overview = "";
  }

  let toc: { title: string; timestamp: string; seconds: number }[] = [];
  try {
    const tocRaw = await llmChat(
      `Based on this video transcript, identify the main topics or steps covered. Return a JSON array (no markdown fences, no extra text) of up to 10 objects, each with:\n- "title": a short topic name\n- "timestamp": a human readable time like "0:32"\n- "seconds": the timestamp in seconds as a number\n\nReturn only the JSON array.\n\nTranscript with timestamps:\n${transcriptWithTimestamps}`
    );
    const cleaned = tocRaw.replace(/^```[a-z]*\n?/, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) toc = parsed;
  } catch {
    toc = [];
  }

  let content = "";
  try {
    const contentRaw = await llmChat(
      `Based on this video transcript, generate a step-by-step guide as HTML. Use <h2 data-seconds="SECONDS"> for section headings (replace SECONDS with the timestamp in seconds as a number) and <p> tags for steps. Return only the HTML, no markdown fences, no extra text.\n\nTranscript with timestamps:\n${transcriptWithTimestamps}`
    );
    content = contentRaw.replace(/^```[a-z]*\n?/, "").replace(/```\s*$/, "").trim();
  } catch {
    content = `<p>${plainText.slice(0, 2000)}</p>`;
  }

  const rows = await query<{ id: string }>(
    `INSERT INTO videos (title, department, embed_url, transcript, content, overview, toc, company_id, is_corporate, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
     RETURNING id`,
    [title, department, embedUrl, vttText, content, overview, JSON.stringify(toc), companyId, isCorporate, session.email]
  );

  const videoId = rows[0].id;

  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    ["videos", videoId, "INSERT", session.email, JSON.stringify({ title, department })]
  );

  return NextResponse.json({ video_id: videoId, title, overview });
}
