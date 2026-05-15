import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await query<{
      id: string;
      title: string;
      department: string;
      created_at: string;
      validated_by: string | null;
    }>(
      `SELECT id, title, department, created_at, validated_by
       FROM videos
       ORDER BY department ASC, created_at ASC`
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
