import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { chat } from "@/lib/ollama";

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

const DISCOVERY_PROMPT =
  "You are a process discovery assistant. Based on the user's question, " +
  "identify which documented workflows are most relevant and explain " +
  "what they cover. Only reference workflows and rules that exist in " +
  "the knowledge base. Do not invent names, contacts, titles, or " +
  "processes. If you cannot find a relevant documented process, say: " +
  "We do not have a documented process for that yet.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, workflowId } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
      workflowId?: string;
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

    let systemPrompt: string;

    if (workflowId) {
      const rules = await query<{
        summary: string;
        detail: string | null;
        rule_type: string;
        confidence: string;
        owner_name: string | null;
      }>(
        `SELECT summary, detail, rule_type, confidence, owner_name
         FROM rules
         WHERE workflow_id = $1
         ORDER BY rule_type, confidence DESC`,
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
          const lines = [`[${ruleType}] (confidence: ${r.confidence}) — ${r.summary}`];
          if (r.detail) lines.push(`Detail: ${r.detail}`);
          return lines.join("\n");
        })
        .join("\n\n");

      systemPrompt = `${WORKFLOW_PROMPT_TEMPLATE.replace("[owner_name]", topOwner)}\n\n=== DOCUMENTED RULES — YOUR ONLY SOURCE OF TRUTH ===\n${rulesContext}\n=== END OF DOCUMENTED RULES ===`;
    } else {
      const rows = await query<{
        workflow_id: string;
        workflow_name: string;
        department: string;
        summary: string;
      }>(
        `SELECT w.id AS workflow_id, w.name AS workflow_name, w.department, r.summary
         FROM workflows w
         LEFT JOIN rules r ON r.workflow_id = w.id
         ORDER BY w.department, w.name`
      );

      const workflowMap = new Map<string, { name: string; department: string; summaries: string[] }>();
      for (const row of rows) {
        if (!workflowMap.has(row.workflow_id)) {
          workflowMap.set(row.workflow_id, { name: row.workflow_name, department: row.department, summaries: [] });
        }
        if (row.summary) workflowMap.get(row.workflow_id)!.summaries.push(row.summary);
      }

      const knowledgeBase = Array.from(workflowMap.values())
        .map((w) => {
          const rules = w.summaries.length
            ? w.summaries.map((s) => `  - ${s}`).join("\n")
            : "  (no rules documented yet)";
          return `Workflow: ${w.name} (${w.department})\n${rules}`;
        })
        .join("\n\n");

      systemPrompt = `${DISCOVERY_PROMPT}\n\n--- DOCUMENTED WORKFLOWS ---\n${knowledgeBase}`;
    }

    const stream = await chat(messages, systemPrompt);

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
