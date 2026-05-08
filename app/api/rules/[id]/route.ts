import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["editor", "admin", "developer"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: ruleId } = await params;

    if (!ruleId) {
      return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
    }

    const existing = await query<{ id: string; workflow_id: string }>(
      `SELECT id, workflow_id FROM rules WHERE id = $1`,
      [ruleId]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    const workflowId = existing[0].workflow_id;

    const deleted = await query<{ id: string }>(
      `DELETE FROM rules WHERE id = $1 RETURNING id`,
      [ruleId]
    );

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
       VALUES ('rules', $1, 'DELETE', $2, $3::jsonb)`,
      [ruleId, session.email, JSON.stringify({ ruleId })]
    );

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    fetch(`${base}/api/workflows/${workflowId}/generate-narrative`, { method: "POST" }).catch(() => {});

    return NextResponse.json({ success: true, ruleId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
