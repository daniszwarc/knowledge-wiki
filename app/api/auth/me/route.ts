import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await validateSession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companies = await query<{ id: string; name: string; company_number: number | null }>(
    `SELECT c.id, c.name, c.company_number
     FROM companies c
     JOIN user_companies uc ON c.id = uc.company_id
     WHERE uc.user_id = $1
     ORDER BY c.company_number ASC`,
    [session.userId]
  );

  const userRows = await query<{ two_fa_method: string; created_at: string }>(
    `SELECT two_fa_method, created_at FROM users WHERE id = $1`,
    [session.userId]
  );
  const userExtra = userRows[0];

  return NextResponse.json({
    id: session.userId,
    email: session.email,
    role: session.role,
    two_fa_method: userExtra?.two_fa_method ?? "totp",
    created_at: userExtra?.created_at ?? null,
    companies,
  });
}
