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
      title: string;
      department: string | null;
      workflow_name: string | null;
      content: string;
      source_filename: string | null;
      source_url: string | null;
      created_at: string;
      created_by: string | null;
      stakeholder_validated: boolean;
      validated_by: string | null;
      validated_at: string | null;
      is_corporate: boolean;
      company_name: string | null;
      company_number: number | null;
    }>(
      `SELECT a.id, a.title, a.department, a.workflow_name, a.content,
              a.source_filename, a.source_url, a.created_at, a.created_by,
              a.stakeholder_validated, a.validated_by, a.validated_at,
              COALESCE(a.is_corporate, false) AS is_corporate,
              c.name AS company_name,
              c.company_number
       FROM articles a
       LEFT JOIN companies c ON c.id = a.company_id
       WHERE a.id = $1`,
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
    if (!["validator", "editor", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await query<{ id: string; title: string; department: string | null }>(
      `SELECT id, title, department FROM articles WHERE id = $1`,
      [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await query(`DELETE FROM articles WHERE id = $1`, [id]);

    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, previous_value)
       VALUES ('articles', $1, 'DELETE', $2, $3::jsonb)`,
      [id, session.email, JSON.stringify(existing[0])]
    );

    return NextResponse.json({ success: true, articleId: id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
