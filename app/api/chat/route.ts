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

function isCrossSedQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  const signals = [
    "other sed", "other seds", "similar sed", "similar issue", "another sed",
    "any sed", "related sed", "same issue", "same problem", "seen this before",
    "other ticket", "other story", "has this happened",
    "find similar issues", "find similar", "similar issues in other",
  ];
  return signals.some((s) => lower.includes(s));
}

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
    const { messages, workflowId, context, sedId, sedSearch } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
      workflowId?: string | null;
      context?: string;
      sedId?: string;
      sedSearch?: boolean;
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

    if (sedId) {
      const sedRows = await query<{
        id: string;
        project_title: string;
        story_number: string | null;
        inc_ticket: string | null;
        cab_ticket: string | null;
        td_oms_task: string | null;
        company: string | null;
        requestor: string | null;
        programmer: string | null;
        contributors: string | null;
        approved_by: string | null;
        date: string | null;
        affected_systems: string | null;
        business_requirements: string | null;
        it_design: string | null;
        unit_testing: string | null;
        acceptance_testing: string | null;
      }>(
        `SELECT id, project_title, story_number, inc_ticket, cab_ticket, td_oms_task,
                company, requestor, programmer, contributors, approved_by, date,
                affected_systems, business_requirements, it_design, unit_testing,
                acceptance_testing
         FROM seds WHERE id = $1`,
        [sedId]
      );

      if (sedRows.length === 0) {
        return new Response(JSON.stringify({ error: "SED not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sed = sedRows[0];
      const sedContext = `
SED METADATA:
- Project title: ${sed.project_title}
- Story number: ${sed.story_number}
- Originating ticket: ${sed.inc_ticket ?? 'not specified'}
- CAB ticket: ${sed.cab_ticket ?? 'not specified'}
- TD/OMS Task: ${sed.td_oms_task ?? 'not specified'}
- Company: ${sed.company ?? 'not specified'}
- Requestor (person who requested the work): ${sed.requestor ?? 'not specified'}
- Programmer (person who implemented the fix): ${sed.programmer ?? 'not specified'}
- Contributors: ${sed.contributors ?? 'not specified'}
- Approved by: ${sed.approved_by ?? 'not specified'}
- Date: ${sed.date ?? 'not specified'}
- Affected systems: ${sed.affected_systems ?? 'not specified'}

USER / BUSINESS REQUIREMENTS:
${sed.business_requirements ?? 'not documented'}

IT DESIGN:
${sed.it_design ?? 'not documented'}

UNIT TESTING:
${sed.unit_testing ?? 'not documented'}

QA / ACCEPTANCE TESTING:
${sed.acceptance_testing ?? 'not documented'}
`.trim();

      let relatedContext = "";
      if (isCrossSedQuestion(lastUserMessage)) {
        try {
          const words = lastUserMessage.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
          if (words.length > 0) {
            type RelatedSed = { id: string; project_title: string; story_number: string | null; inc_ticket: string | null; business_requirements: string | null };
            const relatedRows = await query<RelatedSed>(
              `SELECT id, project_title, story_number, inc_ticket,
                      LEFT(business_requirements, 300) AS business_requirements
               FROM seds
               WHERE id != $1
                 AND to_tsvector('english',
                   COALESCE(project_title, '') || ' ' ||
                   COALESCE(business_requirements, '') || ' ' ||
                   COALESCE(it_design, '')
                 ) @@ plainto_tsquery('english', $2)
               ORDER BY ts_rank(
                 to_tsvector('english',
                   COALESCE(project_title, '') || ' ' ||
                   COALESCE(business_requirements, '') || ' ' ||
                   COALESCE(it_design, '')
                 ),
                 plainto_tsquery('english', $2)
               ) DESC
               LIMIT 3`,
              [sedId, words]
            );
            let finalRelatedRows = relatedRows;
            if (relatedRows.length === 0) {
              finalRelatedRows = await query<RelatedSed>(
                `SELECT id, project_title, story_number, inc_ticket,
                        LEFT(business_requirements, 300) AS business_requirements
                 FROM seds
                 WHERE id != $1
                 ORDER BY created_at DESC
                 LIMIT 10`,
                [sedId]
              );
            }
            if (finalRelatedRows.length > 0) {
              const relatedLines = finalRelatedRows.map((r) =>
                `Story ${r.story_number ?? r.id.substring(0, 8)}: ${r.project_title} (Ticket: ${r.inc_ticket ?? "N/A"})\n` +
                `Business requirements: ${(r.business_requirements ?? "").substring(0, 300)}\n` +
                `Link: /sed/${r.id}`
              );
              relatedContext =
                "\n\nRELATED SEDs FROM THE WIKI (may be relevant):\n\n" +
                relatedLines.join("\n\n");
            }
          }
        } catch {
          // cross-SED search failed gracefully — continue with current SED only
        }
      }

      const fullContext = sedContext + relatedContext;

      const systemPrompt =
        "Answer questions about this SED using ONLY the information below. " +
        "Be direct and specific. Quote directly when possible. 2-3 sentences maximum. " +
        "If asked about the programmer, use the Programmer field. " +
        "If asked about who requested, use the Requestor field. " +
        (relatedContext
          ? "The user is asking about similar issues in other SEDs. " +
            "Search the RELATED SEDs section and identify ONLY the ones that have " +
            "a genuinely similar issue, symptom, or affected system as the current SED. " +
            "If none are truly similar, say so clearly without listing unrelated SEDs. " +
            "Only mention SEDs that are actually relevant — do not list all SEDs just because " +
            "they exist. " +
            "For each relevant SED, state the story number (e.g. Story 102909), " +
            "what the issue was in one sentence, and the link. " +
            "Format links as /sed/[id] — the UI renders them as clickable. "
          : "") +
        "If the answer is not in the document, say: 'This is not covered in this SED.'\n\n" +
        fullContext;

      const stream = await chat(messages, systemPrompt, CHAT_MODEL);
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (sedSearch) {
      const allSeds = await query<{
        id: string;
        project_title: string;
        story_number: string | null;
        inc_ticket: string | null;
        programmer: string | null;
        requestor: string | null;
        business_requirements: string | null;
      }>(
        `SELECT id, project_title, story_number, inc_ticket, programmer, requestor,
                LEFT(business_requirements, 200) AS business_requirements
         FROM seds
         ORDER BY date DESC NULLS LAST, created_at DESC NULLS LAST`
      );

      const sedListContext = allSeds
        .map(
          (s) =>
            `SED: ${s.project_title}\n` +
            `Story: ${s.story_number ?? "N/A"} | Ticket: ${s.inc_ticket ?? "N/A"}\n` +
            `Programmer: ${s.programmer ?? "N/A"} | Requestor: ${s.requestor ?? "N/A"}\n` +
            `Issue: ${(s.business_requirements ?? "").substring(0, 200)}\n` +
            `Link: /sed/${s.id}`
        )
        .join("\n\n");

      const systemPrompt =
        "You are a SED discovery assistant for APi Group. Using ONLY the SEDs listed below, " +
        "answer the user's question and guide them to relevant enhancements.\n\n" +
        "Rules:\n" +
        "- Find SEDs that match the user's question by issue type, system, or symptom\n" +
        "- For each relevant SED, state: story number, project title, who fixed it, and one sentence on what the issue was\n" +
        "- Format links as /sed/[id] — the UI renders them as clickable\n" +
        "- List every relevant SED found — do not omit any\n" +
        "- If nothing matches, say: 'No SEDs found matching that description.'\n" +
        "- Do not add conversational filler. Answer directly and stop.\n\n" +
        "SEDs IN THE SYSTEM:\n" +
        sedListContext;

      const stream = await chat(messages, systemPrompt, CHAT_MODEL);
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (!workflowId) {
      let systemPrompt: string;
      if (context) {
        systemPrompt =
          "You are a helpful assistant answering questions about this document. " +
          "Answer in plain conversational sentences — do not use quotation marks or " +
          "copy text verbatim from the document. Explain in your own words, " +
          "as if you are helping a colleague understand the process. " +
          "Be concise — 1 to 3 sentences maximum. " +
          "Stay strictly grounded in the document content — do not add information " +
          "not present in the document. " +
          "If the answer is not in the document, say so clearly.\n\n" +
          "DOCUMENT:\n" + context;
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
