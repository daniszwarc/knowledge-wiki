import { NextRequest, NextResponse } from "next/server";
import { query, getUserCompanyIds } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bypassFilter = ["admin", "super_admin", "developer"].includes(session.role);
    const companyIds = bypassFilter ? null : await getUserCompanyIds(session.userId);

    const whereClause = bypassFilter
      ? ""
      : "WHERE (company_id IS NULL OR is_corporate = true OR company_id = ANY($1::uuid[]))";
    const params: unknown[] = bypassFilter ? [] : [companyIds ?? []];

    const rows = await query<{
      id: string;
      ticket_number: string;
      project_title: string;
      department: string | null;
      author: string | null;
      date: string | null;
      created_at: string;
      created_by: string | null;
      inc_ticket: string | null;
      cab_ticket: string | null;
      story_number: string | null;
      td_oms_task: string | null;
      requestor: string | null;
      programmer: string | null;
    }>(
      `SELECT id, ticket_number, project_title, department, author, date, created_at, created_by,
              inc_ticket, cab_ticket, story_number, td_oms_task, requestor, programmer
       FROM seds
       ${whereClause}
       ORDER BY department ASC NULLS LAST, ticket_number ASC`,
      params
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
