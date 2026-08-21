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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description, accepted_files, form_fields, processing_type } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!Array.isArray(accepted_files) || accepted_files.length === 0) {
    return NextResponse.json({ error: "accepted_files must be a non-empty array" }, { status: 400 });
  }
  if (!PROCESSING_TYPES.includes(processing_type)) {
    return NextResponse.json({ error: "invalid processing_type" }, { status: 400 });
  }

  const rows = await query<Category>(
    `UPDATE categories
     SET name = $1, description = $2, accepted_files = $3, form_fields = $4, processing_type = $5
     WHERE id = $6
     RETURNING id, platform_id, name, description, accepted_files, form_fields, processing_type, created_at`,
    [name.trim(), description?.trim() || null, accepted_files, JSON.stringify(form_fields ?? {}), processing_type, id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    ["categories", id, "UPDATE", session.email, JSON.stringify(rows[0])]
  );

  return NextResponse.json(rows[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await query<Category>(
    `DELETE FROM categories WHERE id = $1 RETURNING id, platform_id, name, processing_type`,
    [id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, previous_value)
     VALUES ($1, $2, $3, $4, $5)`,
    ["categories", id, "DELETE", session.email, JSON.stringify(rows[0])]
  );

  return NextResponse.json({ ok: true });
}
