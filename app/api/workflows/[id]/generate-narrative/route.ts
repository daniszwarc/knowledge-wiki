import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import OpenAI from "openai";

const NARRATIVE_PROMPT = `You are a business process documentation specialist.
Write a clear, professional explanation of this business process for internal staff.

Process name: {workflow_name}
Department: {department}

Write the narrative in these sections:

## Overview
One paragraph explaining what this process is, who it applies to, and why it exists.

## How it works
A plain-language explanation of how the process operates.
Write in flowing prose, not bullet points.
Include the key steps, decisions, and handoffs.

## Key rules and requirements
Explain the specific rules, thresholds, and requirements that govern this process. Write as prose, not a list.
Include exact values and thresholds from the source rules.

## Exceptions and special cases
Any known exceptions, edge cases, or special handling.
If none are documented, omit this section.

Use plain language. Avoid jargon.
Write as if explaining to a smart new employee on their first day.
Do not invent information not present in the source rules.
Base everything strictly on the rules provided below.

SOURCE RULES:
{rules_formatted}`;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;

    const workflows = await query<{ id: string; name: string; department: string }>(
      `SELECT id, name, department FROM workflows WHERE id = $1`,
      [workflowId]
    );
    if (workflows.length === 0) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }
    const workflow = workflows[0];

    const rules = await query<{
      summary: string;
      detail: string | null;
      rule_type: string | null;
      confidence: string | null;
      stakeholder_validated: boolean;
      owner_name: string | null;
    }>(
      `SELECT summary, detail, rule_type, confidence, stakeholder_validated, owner_name
       FROM rules WHERE workflow_id = $1
       ORDER BY rule_type, stakeholder_validated DESC`,
      [workflowId]
    );

    if (rules.length === 0) {
      return NextResponse.json({ narrative: null });
    }

    const rulesFormatted = rules
      .map((r, i) => {
        const lines: string[] = [
          `Rule ${i + 1}:`,
          `  Type: ${r.rule_type ?? "general"}`,
          `  Summary: ${r.summary}`,
        ];
        if (r.detail) lines.push(`  Detail: ${r.detail}`);
        if (r.confidence) lines.push(`  Confidence: ${r.confidence}`);
        if (r.owner_name) lines.push(`  Owner: ${r.owner_name}`);
        if (r.stakeholder_validated) lines.push(`  Validated: yes`);
        return lines.join("\n");
      })
      .join("\n\n");

    const prompt = NARRATIVE_PROMPT
      .replace("{workflow_name}", workflow.name)
      .replace("{department}", workflow.department)
      .replace("{rules_formatted}", rulesFormatted);

    const client = new OpenAI({
      baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
      apiKey: "ollama",
    });

    const completion = await client.chat.completions.create({
      model: process.env.OLLAMA_CHAT_MODEL ?? "llama3.2",
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });

    const narrative = completion.choices[0]?.message?.content ?? "";

    await query(
      `UPDATE workflows SET process_narrative = $1, narrative_generated_at = now() WHERE id = $2`,
      [narrative, workflowId]
    );

    const updated = await query<{ narrative_generated_at: string }>(
      `SELECT narrative_generated_at FROM workflows WHERE id = $1`,
      [workflowId]
    );

    return NextResponse.json({ narrative, generated_at: updated[0]?.narrative_generated_at });
  } catch (err) {
    console.error("[generate-narrative]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
