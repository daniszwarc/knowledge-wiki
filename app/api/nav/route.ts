import { NextResponse } from "next/server";
import { query } from "@/lib/db";

interface NavWorkflow {
  id: string;
  name: string;
  department: string;
  completeness_score: number;
  rule_count: string;
}

interface NavArticle {
  id: string;
  title: string;
  workflow_name: string | null;
  stakeholder_validated: boolean;
}

interface NavDepartment {
  department: string;
  workflows: NavWorkflow[];
  articles: NavArticle[];
}

export async function GET() {
  try {
    const [workflows, articles] = await Promise.all([
      query<NavWorkflow>(
        `SELECT w.id, w.name, w.department, w.completeness_score,
                COUNT(r.id) as rule_count
         FROM workflows w
         LEFT JOIN rules r ON r.workflow_id = w.id
         GROUP BY w.id
         ORDER BY w.department, w.name`
      ),
      query<{ id: string; title: string; department: string | null; workflow_name: string | null; stakeholder_validated: boolean }>(
        `SELECT id, title, department, workflow_name, stakeholder_validated
         FROM articles
         ORDER BY department, title`
      ),
    ]);

    const deptMap = new Map<string, NavDepartment>();

    for (const wf of workflows) {
      if (!deptMap.has(wf.department)) {
        deptMap.set(wf.department, { department: wf.department, workflows: [], articles: [] });
      }
      deptMap.get(wf.department)!.workflows.push(wf);
    }

    for (const art of articles) {
      const dept = art.department ?? "General";
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { department: dept, workflows: [], articles: [] });
      }
      deptMap.get(dept)!.articles.push({
        id: art.id,
        title: art.title,
        workflow_name: art.workflow_name,
        stakeholder_validated: art.stakeholder_validated,
      });
    }

    const result = Array.from(deptMap.values()).sort((a, b) =>
      a.department.localeCompare(b.department)
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
