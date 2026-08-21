import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

const ADMIN_ROLES = ["admin", "super_admin", "developer"];
const PROCESSING_TYPES = ["rules", "article", "sed", "video"];

interface Category {
  id: string;
  platform_id: string;
  name: string;
  description: string | null;
  accepted_files: string[];
  form_fields: Record<string, boolean>;
  processing_type: string;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const platformId = req.nextUrl.searchParams.get("platform_id");
  const rows = platformId
    ? await query<Category>(
        `SELECT id, platform_id, name, description, accepted_files, form_fields, processing_type, created_at
         FROM categories WHERE platform_id = $1 ORDER BY created_at ASC`,
        [platformId]
      )
    : await query<Category>(
        `SELECT id, platform_id, name, description, accepted_files, form_fields, processing_type, created_at
         FROM categories ORDER BY created_at ASC`
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

  const { platform_id, name, description, accepted_files, form_fields, processing_type } = await req.json();

  if (!platform_id || !name?.trim()) {
    return NextResponse.json({ error: "platform_id and name are required" }, { status: 400 });
  }
  if (!Array.isArray(accepted_files) || accepted_files.length === 0) {
    return NextResponse.json({ error: "accepted_files must be a non-empty array" }, { status: 400 });
  }
  if (!PROCESSING_TYPES.includes(processing_type)) {
    return NextResponse.json({ error: "invalid processing_type" }, { status: 400 });
  }

  const rows = await query<Category>(
    `INSERT INTO categories (platform_id, name, description, accepted_files, form_fields, processing_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, platform_id, name, description, accepted_files, form_fields, processing_type, created_at`,
    [platform_id, name.trim(), description?.trim() || null, accepted_files, JSON.stringify(form_fields ?? {}), processing_type]
  );

  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    ["categories", rows[0].id, "INSERT", session.email, JSON.stringify(rows[0])]
  );

  return NextResponse.json(rows[0], { status: 201 });
}
