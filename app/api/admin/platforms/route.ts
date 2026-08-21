import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

const ADMIN_ROLES = ["admin", "super_admin", "developer"];

export async function GET(req: NextRequest) {
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await query<{ id: string; name: string; slug: string; created_at: string }>(
    `SELECT id, name, slug, created_at FROM platforms ORDER BY created_at ASC`
  );

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
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
    `INSERT INTO platforms (name, slug) VALUES ($1, $2) RETURNING id, name, slug, created_at`,
    [name.trim(), slug.trim()]
  );

  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    ["platforms", rows[0].id, "INSERT", session.email, JSON.stringify(rows[0])]
  );

  return NextResponse.json(rows[0], { status: 201 });
}
