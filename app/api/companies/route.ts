import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

const ALL_COMPANIES = { id: "all", name: "All Companies / Corporate" };

export async function GET(req: NextRequest) {
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await query<{ id: string; name: string; company_number: number | null }>(
    `SELECT id, name, company_number FROM companies ORDER BY company_number ASC`
  );

  return NextResponse.json([ALL_COMPANIES, ...rows]);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const rows = await query<{ id: string; name: string }>(
    `INSERT INTO companies (name, created_by) VALUES ($1, $2) RETURNING id, name`,
    [name.trim(), session.email]
  );

  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    ["companies", rows[0].id, "INSERT", session.email, JSON.stringify({ name: rows[0].name })]
  );

  return NextResponse.json(rows[0], { status: 201 });
}
