import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

const PIPELINE_URL = process.env.PIPELINE_URL ?? "http://localhost:8001";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["editor", "admin", "developer"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const fd = new FormData();
  fd.append("file", file, file.name);
  fd.append("owner_name", session.email);
  fd.append("owner_email", session.email);

  const pipelineRes = await fetch(`${PIPELINE_URL}/ingest/sed`, { method: "POST", body: fd });
  if (!pipelineRes.ok) {
    const err = await pipelineRes.json().catch(() => ({ detail: pipelineRes.statusText }));
    return NextResponse.json({ error: err.detail ?? "Pipeline error" }, { status: 502 });
  }

  const json = await pipelineRes.json();

  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      "seds",
      json.sed_id ?? null,
      "INSERT",
      session.email,
      JSON.stringify({ ticket_number: json.ticket_number, project_title: json.project_title }),
    ]
  );

  return NextResponse.json({
    sed_id: json.sed_id,
    ticket_number: json.ticket_number,
    project_title: json.project_title,
  });
}
