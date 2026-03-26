import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ruleId, validatedBy } = body as { ruleId: string; validatedBy: string };

    if (!ruleId || !validatedBy) {
      return NextResponse.json({ error: "ruleId and validatedBy are required" }, { status: 400 });
    }

    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const note = `Validated by ${validatedBy} on ${date}`;

    const updated = await query<{ workflow_id: string }>(
      `UPDATE rules
       SET stakeholder_validated = true,
           stakeholder_notes = $1,
           updated_at = now()
       WHERE id = $2
       RETURNING workflow_id`,
      [note, ruleId]
    );

    const workflowId = updated[0]?.workflow_id;

    if (workflowId) {
      await query(
        `UPDATE workflows
         SET completeness_score = (
           SELECT ROUND(COUNT(*) FILTER (WHERE stakeholder_validated = true) * 100.0 /
                  NULLIF(COUNT(*), 0))
           FROM rules WHERE workflow_id = workflows.id
         )
         WHERE id = $1`,
        [workflowId]
      );
    }

    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
       VALUES ('rules', $1, 'INSERT', $2, $3::jsonb)`,
      [ruleId, validatedBy, JSON.stringify({ ruleId, validatedBy, note })]
    );

    return NextResponse.json({ success: true, ruleId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
