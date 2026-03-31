import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;
    const body = await req.json();
    const { narrative } = body;

    if (typeof narrative !== "string") {
      return NextResponse.json({ error: "narrative must be a string" }, { status: 400 });
    }

    await query(
      `UPDATE workflows SET process_narrative = $1, narrative_generated_at = NOW() WHERE id = $2`,
      [narrative, workflowId]
    );

    const updated = await query<{ narrative_generated_at: string }>(
      `SELECT narrative_generated_at FROM workflows WHERE id = $1`,
      [workflowId]
    );

    return NextResponse.json({ narrative, generated_at: updated[0]?.narrative_generated_at });
  } catch (err) {
    console.error("[narrative PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
