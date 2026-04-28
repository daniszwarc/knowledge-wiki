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
  const title = (formData.get("title") as string | null)?.trim();
  const department = (formData.get("department") as string | null)?.trim();
  const workflowName = (formData.get("workflow_name") as string | null)?.trim() || title;
  const appearsAsRaw = (formData.get("appears_as") as string | null) ?? "how_to_guide";

  if (!file || !title || !department) {
    return NextResponse.json({ error: "file, title, and department are required" }, { status: 400 });
  }

  const appearsAsArray = appearsAsRaw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => ["how_to_guide", "training_material"].includes(s));
  if (appearsAsArray.length === 0) appearsAsArray.push("how_to_guide");

  const articleType = appearsAsArray[0];

  const fd = new FormData();
  fd.append("file", file, file.name);
  fd.append("workflow_name", workflowName!);
  fd.append("department", department);
  fd.append("article_type", articleType);
  fd.append("owner_name", session.email);
  fd.append("owner_email", session.email);

  const pipelineRes = await fetch(`${PIPELINE_URL}/ingest`, { method: "POST", body: fd });
  if (!pipelineRes.ok) {
    const err = await pipelineRes.json().catch(() => ({ detail: pipelineRes.statusText }));
    return NextResponse.json({ error: err.detail ?? "Pipeline error" }, { status: 502 });
  }

  const json = await pipelineRes.json();
  const articleId: string | null = json.article_id ?? null;

  if (articleId) {
    await query(
      `UPDATE articles SET appears_as = $1 WHERE id = $2`,
      [appearsAsArray, articleId]
    );
  }

  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      "articles",
      articleId,
      "INSERT",
      session.email,
      JSON.stringify({ title, department, appears_as: appearsAsArray }),
    ]
  );

  return NextResponse.json({
    article_id: articleId,
    title: json.article_title ?? title,
  });
}
