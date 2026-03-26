import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function query<T extends object>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const { rows } = await pool.query<T>(sql, params);
  return rows;
}

export async function getRulesForWorkflow(workflowId: string) {
  return query<{
    id: string;
    workflow_id: string;
    summary: string;
    detail: string;
    rule_type: string;
    confidence: "high" | "medium" | "low";
    stakeholder_validated: boolean;
    stakeholder_notes: string | null;
    owner_email: string | null;
    owner_name: string | null;
    source: string | null;
    source_url: string | null;
    extracted_at: string;
    updated_at: string;
  }>(
    `SELECT id, workflow_id, summary, detail, rule_type, confidence,
            stakeholder_validated, stakeholder_notes, owner_email,
            owner_name, source, source_url, extracted_at, updated_at
     FROM rules
     WHERE workflow_id = $1
     ORDER BY rule_type, extracted_at`,
    [workflowId]
  );
}

export async function getWorkflowWithRules(workflowId: string) {
  const workflows = await query<{
    id: string;
    name: string;
    department: string;
    description: string;
    completeness_score: number;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, name, department, description,
            COALESCE((
              SELECT ROUND(COUNT(*) FILTER (WHERE stakeholder_validated = true) * 100.0 /
                     NULLIF(COUNT(*), 0))
              FROM rules WHERE workflow_id = $1
            ), 0) AS completeness_score,
            created_at, updated_at
     FROM workflows WHERE id = $1`,
    [workflowId]
  );

  if (workflows.length === 0) return null;

  const rules = await getRulesForWorkflow(workflowId);
  return { ...workflows[0], rules };
}

export async function getAllWorkflowsWithStats() {
  return query<{
    id: string;
    name: string;
    department: string;
    description: string;
    completeness_score: number;
    created_at: string;
    updated_at: string;
    rule_count: string;
    validated_count: string;
    gap_count: string;
  }>(
    `SELECT
       w.id,
       w.name,
       w.department,
       w.description,
       COALESCE(ROUND(COUNT(DISTINCT r.id) FILTER (WHERE r.stakeholder_validated) * 100.0 / NULLIF(COUNT(DISTINCT r.id), 0)), 0) AS completeness_score,
       w.created_at,
       w.updated_at,
       COUNT(DISTINCT r.id)                                            AS rule_count,
       COUNT(DISTINCT r.id) FILTER (WHERE r.stakeholder_validated)    AS validated_count,
       COUNT(DISTINCT g.id) FILTER (WHERE g.status = 'open')          AS gap_count
     FROM workflows w
     LEFT JOIN rules r ON r.workflow_id = w.id
     LEFT JOIN gaps  g ON g.workflow_id = w.id
     GROUP BY w.id
     ORDER BY w.department, w.name`
  );
}
