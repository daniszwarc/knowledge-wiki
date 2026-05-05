import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

function requireAdminOrAbove(req: NextRequest) {
  const role = req.headers.get("x-user-role");
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = requireAdminOrAbove(req);
  if (err) return err;

  const { id } = await params;

  const rows = await query<{ company_id: string }>(
    `SELECT company_id FROM user_companies WHERE user_id = $1`,
    [id]
  );

  return NextResponse.json(rows.map((r) => r.company_id));
}
