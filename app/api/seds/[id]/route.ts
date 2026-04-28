import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await query<{
      id: string;
      ticket_number: string;
      project_title: string;
      department: string | null;
      author: string | null;
      date: string | null;
      affected_systems: string | null;
      business_requirements: string | null;
      it_design: string | null;
      unit_testing: string | null;
      acceptance_testing: string | null;
      source_filename: string | null;
      created_by: string | null;
      created_at: string;
      updated_at: string;
      inc_ticket: string | null;
      cab_ticket: string | null;
      story_number: string | null;
      td_oms_task: string | null;
      requestor: string | null;
      programmer: string | null;
      contributors: string | null;
      approved_by: string | null;
      company: string | null;
      business_requirements_images: string[] | null;
      it_design_images: string[] | null;
      unit_testing_images: string[] | null;
      acceptance_testing_images: string[] | null;
      business_requirements_content: { type: string; value: string }[] | null;
      it_design_content: { type: string; value: string }[] | null;
      unit_testing_content: { type: string; value: string }[] | null;
      acceptance_testing_content: { type: string; value: string }[] | null;
    }>(
      `SELECT id, ticket_number, project_title, department, author, date,
              affected_systems, business_requirements, it_design, unit_testing,
              acceptance_testing, source_filename, created_by, created_at, updated_at,
              inc_ticket, cab_ticket, story_number, td_oms_task,
              requestor, programmer, contributors, approved_by, company,
              business_requirements_images, it_design_images,
              unit_testing_images, acceptance_testing_images,
              business_requirements_content, it_design_content,
              unit_testing_content, acceptance_testing_content
       FROM seds WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const { id } = await params;

    const existing = await query<{ id: string; ticket_number: string; project_title: string }>(
      `SELECT id, ticket_number, project_title FROM seds WHERE id = $1`,
      [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await query(`DELETE FROM seds WHERE id = $1`, [id]);

    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, previous_value)
       VALUES ('seds', $1, 'DELETE', $2, $3::jsonb)`,
      [id, session.email, JSON.stringify(existing[0])]
    );

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
