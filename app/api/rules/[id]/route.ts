import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: ruleId } = params;

    if (!ruleId) {
      return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
    }

    const deleted = await query<{ id: string }>(
      `DELETE FROM rules WHERE id = $1 RETURNING id`,
      [ruleId]
    );

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
       VALUES ('rules', $1, 'DELETE', 'manual-delete', $2::jsonb)`,
      [ruleId, JSON.stringify({ ruleId })]
    );

    return NextResponse.json({ success: true, ruleId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
