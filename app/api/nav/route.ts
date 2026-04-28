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
  department: string | null;
  stakeholder_validated: boolean;
}

function groupByDepartment<T extends { department: string | null }>(
  items: T[],
  key: "workflows" | "articles"
) {
  const map = new Map<string, { department: string; [k: string]: unknown }>();
  for (const item of items) {
    const dept = item.department ?? "General";
    if (!map.has(dept)) {
      map.set(dept, { department: dept, [key]: [] });
    }
    (map.get(dept)![key] as T[]).push(item);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.department.localeCompare(b.department)
  );
}

export async function GET() {
  try {
    const [workflows, howToGuides, trainingMaterial] = await Promise.all([
      query<NavWorkflow>(
        `SELECT w.id, w.name, w.department, w.completeness_score,
                COUNT(r.id) as rule_count
         FROM workflows w
         LEFT JOIN rules r ON r.workflow_id = w.id
         GROUP BY w.id
         ORDER BY w.department, w.name`
      ),
      query<NavArticle>(
        `SELECT id, title, department, stakeholder_validated
         FROM articles
         WHERE 'how_to_guide' = ANY(COALESCE(appears_as, ARRAY['how_to_guide']))
         ORDER BY department, title`
      ),
      query<NavArticle>(
        `SELECT id, title, department, stakeholder_validated
         FROM articles
         WHERE 'training_material' = ANY(COALESCE(appears_as, ARRAY['how_to_guide']::text[]))
         ORDER BY department, title`
      ),
    ]);

    return NextResponse.json({
      businessRules: groupByDepartment(workflows, "workflows"),
      howToGuides: groupByDepartment(howToGuides, "articles"),
      trainingMaterial: groupByDepartment(trainingMaterial, "articles"),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
