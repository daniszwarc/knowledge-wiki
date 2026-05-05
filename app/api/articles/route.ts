import { NextRequest, NextResponse } from "next/server";
import { query, getUserCompanyIds } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const unvalidatedOnly = searchParams.get("unvalidated") === "1";

    const bypassFilter = ["admin", "super_admin", "developer"].includes(session.role);
    const companyIds = bypassFilter ? null : await getUserCompanyIds(session.userId);

    const conditions: string[] = [];
    if (unvalidatedOnly) conditions.push("stakeholder_validated = false");
    if (!bypassFilter) conditions.push("(company_id IS NULL OR is_corporate = true OR company_id = ANY($1::uuid[]))");

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const params: unknown[] = !bypassFilter ? [companyIds ?? []] : [];

    const articles = await query<{
      id: string;
      title: string;
      department: string | null;
      workflow_name: string | null;
      source_filename: string | null;
      created_at: string;
      stakeholder_validated: boolean;
    }>(
      `SELECT id, title, department, workflow_name, source_filename, created_at, stakeholder_validated
       FROM articles
       ${whereClause}
       ORDER BY department NULLS LAST, title`,
      params
    );
    return NextResponse.json(articles);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
