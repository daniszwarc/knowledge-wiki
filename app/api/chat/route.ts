import { NextRequest } from "next/server";
import { getRulesForWorkflow, query } from "@/lib/db";
import { chat } from "@/lib/ollama";

const SYSTEM_PROMPT_BASE =
  "You are a knowledge assistant. Answer questions about internal business " +
  "processes using only the rules provided below. Never invent rules. " +
  "If confidence is low or unvalidated, say so. If the answer is not in " +
  "the provided rules, respond: I do not have documented information about " +
  "that process. Please contact [owner_name] or flag this as a gap.";

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

    let rulesContext = "";

    if (workflowId) {
      const rules = await getRulesForWorkflow(workflowId);
      rulesContext = rules
        .map(
          (r) =>
            `[${r.rule_type?.toUpperCase() ?? "RULE"}] ${r.summary}\n${r.detail ?? ""}\n` +
            `Owner: ${r.owner_name ?? "unknown"} | Confidence: ${r.confidence} | Validated: ${r.stakeholder_validated}`
        )
        .join("\n\n");
    } else {
      const allRules = await query<{
        summary: string;
        detail: string;
        rule_type: string;
        confidence: string;
        stakeholder_validated: boolean;
        owner_name: string | null;
        workflow_name: string;
      }>(
        `SELECT r.summary, r.detail, r.rule_type, r.confidence,
                r.stakeholder_validated, r.owner_name, w.name AS workflow_name
         FROM rules r
         JOIN workflows w ON w.id = r.workflow_id
         ORDER BY w.department, w.name`
      );
      rulesContext = allRules
        .map(
          (r) =>
            `[${r.workflow_name}] [${r.rule_type?.toUpperCase() ?? "RULE"}] ${r.summary}\n${r.detail ?? ""}\n` +
            `Owner: ${r.owner_name ?? "unknown"} | Confidence: ${r.confidence} | Validated: ${r.stakeholder_validated}`
        )
        .join("\n\n");
    }

    const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n--- RULES ---\n${rulesContext}`;

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
