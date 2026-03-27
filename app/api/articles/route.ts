import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unvalidatedOnly = searchParams.get("unvalidated") === "1";

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
       ${unvalidatedOnly ? "WHERE stakeholder_validated = false" : ""}
       ORDER BY department NULLS LAST, title`
    );
    return NextResponse.json(articles);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
