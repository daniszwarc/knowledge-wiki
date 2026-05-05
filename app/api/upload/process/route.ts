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
  const workflowName = (formData.get("workflow_name") as string | null)?.trim();
  const department = (formData.get("department") as string | null)?.trim();
  const isCorporate = formData.get("is_corporate") === "true";
  const companyId = (formData.get("company_id") as string | null) || null;

  if (!file || !workflowName || !department) {
    return NextResponse.json({ error: "file, workflow_name, and department are required" }, { status: 400 });
  }

  const fd = new FormData();
  fd.append("file", file, file.name);
  fd.append("workflow_name", workflowName);
  fd.append("department", department);
  fd.append("owner_name", session.email);
  fd.append("owner_email", session.email);

  const pipelineRes = await fetch(`${PIPELINE_URL}/ingest`, { method: "POST", body: fd });
  if (!pipelineRes.ok) {
    const err = await pipelineRes.json().catch(() => ({ detail: pipelineRes.statusText }));
    return NextResponse.json({ error: err.detail ?? "Pipeline error" }, { status: 502 });
  }

  const json = await pipelineRes.json();
  const workflowId: string | null = json.workflow_id ?? null;

  if (workflowId) {
    await query(
      `UPDATE workflows SET company_id = $1, is_corporate = $2 WHERE id = $3`,
      [companyId, isCorporate, workflowId]
    );
    await query(
      `UPDATE rules SET company_id = $1, is_corporate = $2 WHERE workflow_id = $3`,
      [companyId, isCorporate, workflowId]
    );
  }

  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      "workflows",
      workflowId,
      "INSERT",
      session.email,
      JSON.stringify({ workflow_name: workflowName, department, rules_extracted: json.rules_extracted, company_id: companyId, is_corporate: isCorporate }),
    ]
  );

  return NextResponse.json({
    workflow_id: workflowId,
    workflow_name: workflowName,
    rules_extracted: json.rules_extracted ?? 0,
    article_id: json.article_id ?? null,
  });
}
