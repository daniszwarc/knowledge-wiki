import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
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
       ORDER BY department ASC NULLS LAST, ticket_number ASC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
