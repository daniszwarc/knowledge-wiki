import { NextResponse } from "next/server";
import { query } from "@/lib/db";

interface PendingRule {
  id: string;
  workflow_id: string;
  workflow_name: string;
  department: string;
  summary: string;
  detail: string | null;
  rule_type: string;
  confidence: "high" | "medium" | "low";
  owner_name: string | null;
  owner_email: string | null;
  source: string | null;
}

export async function GET() {
  try {
    const rows = await query<PendingRule>(
      `SELECT r.id, r.workflow_id, w.name AS workflow_name, w.department,
              r.summary, r.detail, r.rule_type, r.confidence,
              r.owner_name, r.owner_email, r.source
       FROM rules r
       JOIN workflows w ON w.id = r.workflow_id
       WHERE r.stakeholder_validated = false
       ORDER BY w.department, w.name, r.rule_type`
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
