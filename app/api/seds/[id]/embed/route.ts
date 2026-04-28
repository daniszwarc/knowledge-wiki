import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { embed } from "@/lib/ollama";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await query<{
      ticket_number: string;
      project_title: string;
      business_requirements: string | null;
      it_design: string | null;
      unit_testing: string | null;
      acceptance_testing: string | null;
    }>(
      `SELECT ticket_number, project_title, business_requirements, it_design,
              unit_testing, acceptance_testing
       FROM seds WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const s = rows[0];
    const text = [
      s.ticket_number,
      s.project_title,
      s.business_requirements,
      s.it_design,
      s.unit_testing,
      s.acceptance_testing,
    ]
      .filter(Boolean)
      .join(" ");

    const vector = await embed(text);
    const literal = `[${vector.join(",")}]`;

    await query(`UPDATE seds SET embedding = $1::vector WHERE id = $2`, [literal, id]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
