import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { ruleId, workflowId, reason, flaggedBy } = body as {
      ruleId?: string;
      workflowId: string;
      reason: string;
      flaggedBy?: string;
    };

    if (!workflowId || !reason) {
      return NextResponse.json(
        { error: "workflowId and reason are required" },
        { status: 400 }
      );
    }

    const gaps = await query<{ id: string }>(
      `INSERT INTO gaps (rule_id, workflow_id, reason, flagged_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [ruleId ?? null, workflowId, reason, flaggedBy ?? "anonymous"]
    );

    const gapId = gaps[0].id;

    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
       VALUES ('gaps', $1, 'INSERT', $2, $3::jsonb)`,
      [
        gapId,
        session.email,
        JSON.stringify({ gapId, ruleId, workflowId, reason, flaggedBy }),
      ]
    );

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    fetch(`${base}/api/workflows/${workflowId}/generate-narrative`, { method: "POST" }).catch(() => {});

    return NextResponse.json({ id: gapId }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
