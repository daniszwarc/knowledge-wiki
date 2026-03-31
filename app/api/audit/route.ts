import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const role = req.headers.get("x-user-role");
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const table = searchParams.get("table") ?? "";
  const action = searchParams.get("action") ?? "";
  const user = searchParams.get("user") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (table) {
    params.push(table);
    conditions.push(`table_name = $${params.length}`);
  }
  if (action) {
    params.push(action);
    conditions.push(`action = $${params.length}`);
  }
  if (user) {
    params.push(`%${user}%`);
    conditions.push(`changed_by ILIKE $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`changed_at >= $${params.length}::date`);
  }
  if (to) {
    params.push(to);
    conditions.push(`changed_at < ($${params.length}::date + interval '1 day')`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM audit_log ${where}`,
      params
    );
    const total = parseInt(countRows[0]?.count ?? "0", 10);

    params.push(limit);
    params.push(offset);

    const entries = await query<{
      id: string;
      table_name: string;
      record_id: string;
      action: string;
      changed_by: string;
      changed_at: string;
      previous_value: unknown;
      new_value: unknown;
    }>(
      `SELECT id, table_name, record_id, action, changed_by, changed_at,
              previous_value, new_value
       FROM audit_log
       ${where}
       ORDER BY changed_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return NextResponse.json({ entries, total, page, limit });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
