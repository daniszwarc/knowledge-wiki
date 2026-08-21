import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

interface Category {
  id: string;
  platform_id: string;
  name: string;
  description: string | null;
  accepted_files: string[];
  form_fields: Record<string, boolean>;
  processing_type: string;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const platformId = req.nextUrl.searchParams.get("platform_id");
  const rows = platformId
    ? await query<Category>(
        `SELECT id, platform_id, name, description, accepted_files, form_fields, processing_type
         FROM categories WHERE platform_id = $1 ORDER BY created_at ASC`,
        [platformId]
      )
    : await query<Category>(
        `SELECT id, platform_id, name, description, accepted_files, form_fields, processing_type
         FROM categories ORDER BY created_at ASC`
      );

  return NextResponse.json(rows);
}
