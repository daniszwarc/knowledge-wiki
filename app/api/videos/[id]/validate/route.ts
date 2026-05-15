import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["validator", "editor", "admin", "developer"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { validatedBy } = await req.json();
    if (!validatedBy || typeof validatedBy !== "string") {
      return NextResponse.json({ error: "validatedBy is required" }, { status: 400 });
    }

    await query(
      `UPDATE videos SET validated_by = $1, validated_at = now(), updated_at = now() WHERE id = $2`,
      [validatedBy.trim(), id]
    );

    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
       VALUES ('videos', $1, 'UPDATE', $2, $3)`,
      [id, session.email, JSON.stringify({ validated_by: validatedBy.trim() })]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
