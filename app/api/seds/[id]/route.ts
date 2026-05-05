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
      is_corporate: boolean;
      company_name: string | null;
      company_number: number | null;
    }>(
      `SELECT s.id, s.ticket_number, s.project_title, s.department, s.author, s.date,
              s.affected_systems, s.business_requirements, s.it_design, s.unit_testing,
              s.acceptance_testing, s.source_filename, s.created_by, s.created_at, s.updated_at,
              s.inc_ticket, s.cab_ticket, s.story_number, s.td_oms_task,
              s.requestor, s.programmer, s.contributors, s.approved_by, s.company,
              s.business_requirements_images, s.it_design_images,
              s.unit_testing_images, s.acceptance_testing_images,
              s.business_requirements_content, s.it_design_content,
              s.unit_testing_content, s.acceptance_testing_content,
              COALESCE(s.is_corporate, false) AS is_corporate,
              c.name AS company_name,
              c.company_number
       FROM seds s
       LEFT JOIN companies c ON c.id = s.company_id
       WHERE s.id = $1`,
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
