import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const gaps = await query<{
      id: string;
      rule_id: string | null;
      workflow_id: string;
      workflow_name: string;
      department: string;
      reason: string;
      flagged_by: string | null;
      flagged_at: string;
      status: string;
      owner_name: string | null;
      owner_email: string | null;
    }>(
      `SELECT
         g.id,
         g.rule_id,
         g.workflow_id,
         w.name        AS workflow_name,
         w.department,
         g.reason,
         g.flagged_by,
         g.flagged_at,
         g.status,
         r.owner_name,
         r.owner_email
       FROM gaps g
       JOIN workflows w ON w.id = g.workflow_id
       LEFT JOIN rules r ON r.id = g.rule_id
       WHERE g.status = 'open'
       ORDER BY w.department, w.name, g.flagged_at DESC`
    );
    return NextResponse.json(gaps);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
