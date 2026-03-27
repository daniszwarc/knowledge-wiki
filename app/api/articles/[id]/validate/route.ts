import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { validatedBy } = await req.json();
    if (!validatedBy || typeof validatedBy !== "string") {
      return NextResponse.json({ error: "validatedBy is required" }, { status: 400 });
    }

    await query(
      `UPDATE articles
       SET stakeholder_validated = true,
           validated_by = $1,
           validated_at = now()
       WHERE id = $2`,
      [validatedBy.trim(), id]
    );

    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
       VALUES ('articles', $1, 'UPDATE', $2, $3)`,
      [id, validatedBy.trim(), JSON.stringify({ stakeholder_validated: true, validated_by: validatedBy.trim() })]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
