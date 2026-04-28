import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

const PIPELINE_URL = process.env.PIPELINE_URL ?? "http://localhost:8001";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["editor", "admin", "developer"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();

    const pipelineForm = new FormData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    pipelineForm.append("file", file, (file as File).name ?? "upload.docx");
    pipelineForm.append("owner_name", (formData.get("owner_name") as string) ?? "");
    pipelineForm.append("owner_email", session.email);

    let pipelineRes: Response;
    try {
      pipelineRes = await fetch(`${PIPELINE_URL}/ingest/sed`, {
        method: "POST",
        body: pipelineForm,
      });
    } catch (fetchErr) {
      console.error("Pipeline unreachable:", fetchErr);
      return NextResponse.json(
        { error: `Cannot reach pipeline at ${PIPELINE_URL}. Is the backend running?` },
        { status: 503 }
      );
    }

    if (!pipelineRes.ok) {
      const err = await pipelineRes.json().catch(() => ({ detail: pipelineRes.statusText }));
      return NextResponse.json({ error: err.detail ?? "Pipeline error" }, { status: pipelineRes.status });
    }

    const result = await pipelineRes.json() as {
      sed_id: string;
      ticket_number: string;
      project_title: string;
      department: string | null;
      updated: boolean;
    };

    const action = result.updated ? "UPDATE" : "INSERT";
    await query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
       VALUES ('seds', $1, $2, $3, $4::jsonb)`,
      [
        result.sed_id,
        action,
        session.email,
        JSON.stringify({ ticket_number: result.ticket_number, project_title: result.project_title }),
      ]
    );

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
