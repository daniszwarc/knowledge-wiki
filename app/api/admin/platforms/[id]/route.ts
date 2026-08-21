import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

const ADMIN_ROLES = ["admin", "super_admin", "developer"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, slug } = await req.json();
  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const rows = await query<{ id: string; name: string; slug: string; created_at: string }>(
    `UPDATE platforms SET name = $1, slug = $2 WHERE id = $3 RETURNING id, name, slug, created_at`,
    [name.trim(), slug.trim(), id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    ["platforms", id, "UPDATE", session.email, JSON.stringify(rows[0])]
  );

  return NextResponse.json(rows[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await query<{ id: string; name: string; slug: string }>(
    `DELETE FROM platforms WHERE id = $1 RETURNING id, name, slug`,
    [id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, previous_value)
     VALUES ($1, $2, $3, $4, $5)`,
    ["platforms", id, "DELETE", session.email, JSON.stringify(rows[0])]
  );

  return NextResponse.json({ ok: true });
}
