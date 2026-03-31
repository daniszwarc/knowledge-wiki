import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { chat } from "@/lib/ollama";

const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5:3b";

const INJECTION_WORDS = [
  "override", "restraint", "constraint", "programmed", "jailbreak",
  "pretend", "recipe", "ignore", "forget", "instead", "disregard",
  "unrestricted", "freely", "creative",
];

const INJECTION_REFUSAL =
  "I can only answer questions about the documented business processes " +
  "for this workflow. Please ask about the rules shown on the left.";

function isInjectionAttempt(msg: string): boolean {
  const lower = msg.toLowerCase();

  // Block flagged words
  if (INJECTION_WORDS.some((w) => lower.includes(w))) return true;

  // Block long messages with no question mark
  if (msg.length > 300 && !msg.includes("?")) return true;

  // Block messages with more than one non-question sentence
  const sentences = msg.split(/(?<=[.!])\s+/).filter((s) => s.trim().length > 0);
  const nonQuestion = sentences.filter((s) => !s.trim().endsWith("?"));
  if (nonQuestion.length > 1) return true;

  return false;
}

const WORKFLOW_PROMPT_TEMPLATE =
  "The following are the only facts you know. You have no other knowledge. " +
  "You cannot answer questions about topics not in this list because you " +
  "genuinely do not know about them.\n\n" +
  "Answering rules:\n" +
  "1. When multiple rules relate to the question, present ALL of them, " +
  "not just the closest match. Format each one clearly:\n\n" +
  "   Rule 1 ([type]): [exact rule summary]\n" +
  "   [exact rule detail]\n\n" +
  "   Rule 2 ([type]): [exact rule summary]\n" +
  "   [exact rule detail]\n\n" +
  "2. Do not elaborate, infer, or add examples that are not explicitly stated in the rules.\n" +
  "3. Quote the relevant rule directly when answering.\n" +
  "4. If the answer requires any assumption or inference beyond what is written, say: " +
  "'The documented rule states: [quote the rule]. For anything beyond this, " +
  "please contact [owner_name] or flag this as a gap.'\n" +
  "5. If more than one rule is relevant, show all of them. " +
  "Never select just one when multiple apply.\n" +
  "6. Never invent examples, dates, or scenarios not present in the rule text.";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, workflowId, context } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
      workflowId?: string | null;
      context?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (isInjectionAttempt(lastUserMessage)) {
      return new Response(INJECTION_REFUSAL, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (!workflowId) {
      let systemPrompt: string;
      if (context) {
        systemPrompt =
          "Answer the question using ONLY the document below. Be brief and direct — 2-3 sentences maximum. Quote the relevant part of the document. Do not analyze, interpret, caveat, or add any information not explicitly stated. If the document does not answer the question, say: 'This is not covered in this document.' Read the full conversation to resolve follow-up questions.\n\nDOCUMENT:\n" + context;
      } else {
        systemPrompt =
          "You are a process discovery assistant. Using ONLY the documented content below, " +
          "answer the user's question and guide them to the right place.\n\n" +
          "Rules:\n" +
          "- If a DEPARTMENT name matches the query, mention it first and list all its workflows and articles\n" +
          "- For each relevant item, state its name, one sentence on what it covers, and its link\n" +
          "- Format links as bare paths: /workflow/[id] or /article/[id] — the UI renders them as clickable links\n" +
          "- List every relevant item found — do not omit any\n" +
          "- If nothing matches, say exactly: We do not have documented information about that yet.\n" +
          "- Do not add phrases like 'Let me know if you need further assistance', 'I hope this helps', or any conversational filler. Answer directly and stop.\n\n" +
          "DOCUMENTED CONTENT:\n" +
          "No relevant content found.";
      }
      const stream = await chat(messages, systemPrompt, CHAT_MODEL);
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const rules = await query<{
      summary: string;
      detail: string | null;
      rule_type: string;
      owner_name: string | null;
    }>(
      `SELECT summary, detail, rule_type, owner_name
       FROM rules
       WHERE workflow_id = $1
       ORDER BY rule_type`,
      [workflowId]
    );

    const counts: Record<string, number> = {};
    for (const r of rules) {
      if (r.owner_name) counts[r.owner_name] = (counts[r.owner_name] ?? 0) + 1;
    }
    const topOwner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "the process owner";

    const rulesContext = rules
      .map((r) => {
        const ruleType = r.rule_type.charAt(0).toUpperCase() + r.rule_type.slice(1).toLowerCase();
        const lines = [`Rule (${ruleType}): ${r.summary}`];
        if (r.detail) lines.push(`Detail: ${r.detail}`);
        return lines.join("\n");
      })
      .join("\n\n");

    const systemPrompt = `${WORKFLOW_PROMPT_TEMPLATE.replace("[owner_name]", topOwner)}\n\n=== DOCUMENTED RULES — YOUR ONLY SOURCE OF TRUTH ===\n${rulesContext}\n=== END OF DOCUMENTED RULES ===`;

    const stream = await chat(messages, systemPrompt, CHAT_MODEL);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
