import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

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

    const existing = await query<{ id: string; title: string; department: string }>(
      `SELECT id, title, department FROM videos WHERE id = $1`,
      [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await query(`DELETE FROM videos WHERE id = $1`, [id]);

    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, previous_value)
       VALUES ('videos', $1, 'DELETE', $2, $3::jsonb)`,
      [id, session.email, JSON.stringify({ title: existing[0].title, department: existing[0].department })]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "developer"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { content } = await req.json() as { content: string };

    await query(
      `UPDATE videos SET content = $1, updated_at = now() WHERE id = $2`,
      [content, id]
    );

    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      ["videos", id, "UPDATE", session.email, JSON.stringify({ content })]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const rows = await query<{
      id: string;
      title: string;
      department: string;
      embed_url: string;
      transcript: string;
      content: string | null;
      overview: string | null;
      toc: { title: string; timestamp: string; seconds: number }[] | null;
      company_id: string | null;
      is_corporate: boolean;
      validated_by: string | null;
      validated_at: string | null;
      created_by: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, title, department, embed_url, transcript, content, overview, toc,
              company_id, is_corporate, validated_by, validated_at,
              created_by, created_at, updated_at
       FROM videos WHERE id = $1`,
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
