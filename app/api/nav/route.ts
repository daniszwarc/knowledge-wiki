import { NextRequest, NextResponse } from "next/server";
import { query, getUserCompanyIds, getUserPlatformIds } from "@/lib/db";
import { validateSession } from "@/lib/auth";

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

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bypassFilter = ["admin", "super_admin", "developer"].includes(session.role);
    const companyIds = bypassFilter ? null : await getUserCompanyIds(session.userId);
    const platformIds = await getUserPlatformIds(session.userId);

    const wfParams: unknown[] = [];
    let wfFilter = "";
    if (!bypassFilter) {
      wfParams.push(companyIds ?? []);
      wfFilter = `AND (w.company_id IS NULL OR w.is_corporate = true OR w.company_id = ANY($${wfParams.length}::uuid[]))`;
    }

    const [workflows, articlesByPlatformEntries] = await Promise.all([
      query<NavWorkflow>(
        `SELECT w.id, w.name, w.department, w.completeness_score,
                COUNT(r.id) as rule_count
         FROM workflows w
         LEFT JOIN rules r ON r.workflow_id = w.id
         WHERE 1=1 ${wfFilter}
         GROUP BY w.id
         ORDER BY w.department, w.name`,
        wfParams
      ),
      Promise.all(
        platformIds.map(async (platformId) => {
          const params: unknown[] = [];
          let companyClause = "";
          if (!bypassFilter) {
            params.push(companyIds ?? []);
            companyClause = ` AND (company_id IS NULL OR is_corporate = true OR company_id = ANY($${params.length}::uuid[]))`;
          }
          params.push(platformId);
          const platformClause = ` AND platform_id = $${params.length}`;

          const [howToGuides, trainingMaterial] = await Promise.all([
            query<NavArticle>(
              `SELECT id, title, department, stakeholder_validated
               FROM articles
               WHERE 'how_to_guide' = ANY(COALESCE(appears_as, ARRAY['how_to_guide']))${companyClause}${platformClause}
               ORDER BY department, title`,
              params
            ),
            query<NavArticle>(
              `SELECT id, title, department, stakeholder_validated
               FROM articles
               WHERE 'training_material' = ANY(COALESCE(appears_as, ARRAY['how_to_guide']::text[]))${companyClause}${platformClause}
               ORDER BY department, title`,
              params
            ),
          ]);

          return [
            platformId,
            {
              howToGuides: groupByDepartment(howToGuides, "articles"),
              trainingMaterial: groupByDepartment(trainingMaterial, "articles"),
            },
          ] as const;
        })
      ),
    ]);

    const articlesByPlatform: Record<string, { howToGuides: unknown; trainingMaterial: unknown }> = {};
    for (const [platformId, data] of articlesByPlatformEntries) {
      articlesByPlatform[platformId] = data;
    }

    return NextResponse.json({
      businessRules: groupByDepartment(workflows, "workflows"),
      articlesByPlatform,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
