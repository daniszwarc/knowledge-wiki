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
    `SELECT c.id, c.name, c.company_number
     FROM companies c
     JOIN user_companies uc ON c.id = uc.company_id
     WHERE uc.user_id = $1
     ORDER BY c.company_number ASC`,
    [session.userId]
  );

  return NextResponse.json([ALL_COMPANIES, ...rows]);
}
