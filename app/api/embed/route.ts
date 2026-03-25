import { NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/ollama";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ruleId } = body as { ruleId: string };

    if (!ruleId) {
      return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
    }

    const rules = await query<{ id: string; summary: string; detail: string | null }>(
      `SELECT id, summary, detail FROM rules WHERE id = $1`,
      [ruleId]
    );

    if (rules.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const rule = rules[0];
    const text = [rule.summary, rule.detail].filter(Boolean).join("\n");
    const vector = await embed(text);
    const vectorLiteral = `[${vector.join(",")}]`;

    await query(
      `UPDATE rules SET embedding = $1::vector, updated_at = now() WHERE id = $2`,
      [vectorLiteral, ruleId]
    );

    return NextResponse.json({ ruleId, dimensions: vector.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
