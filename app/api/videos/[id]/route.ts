import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

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
