import { NextRequest, NextResponse } from "next/server";
import { getWorkflowWithRules } from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["editor", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: workflowId } = await params;

    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM rules WHERE workflow_id = $1`,
      [workflowId]
    );
    if (parseInt(countRows[0].count, 10) > 0) {
      return NextResponse.json(
        { error: "Cannot delete a workflow that has rules. Delete all rules first or use the validation page." },
        { status: 400 }
      );
    }

    const existing = await query<{ id: string; name: string; department: string }>(
      `SELECT id, name, department FROM workflows WHERE id = $1`,
      [workflowId]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await query(`DELETE FROM workflows WHERE id = $1`, [workflowId]);

    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, previous_value)
       VALUES ('workflows', $1, 'DELETE', $2, $3::jsonb)`,
      [workflowId, session.email, JSON.stringify(existing[0])]
    );

    return NextResponse.json({ success: true, workflowId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = await getWorkflowWithRules(id);
    if (!workflow) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const narrativeRows = await query<{ process_narrative: string | null; narrative_generated_at: string | null }>(
      `SELECT process_narrative, narrative_generated_at FROM workflows WHERE id = $1`,
      [id]
    );
    return NextResponse.json({ ...workflow, ...narrativeRows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
