import { query } from "./db";
import { embed } from "./ollama";

export interface SearchResult {
  rule_id: string;
  workflow_id: string;
  workflow_name: string;
  department: string;
  summary: string;
  detail: string;
  rule_type: string;
  confidence: "high" | "medium" | "low";
  stakeholder_validated: boolean;
  owner_name: string | null;
  owner_email: string | null;
  rrf_score: number;
}

export async function hybridSearch(queryText: string): Promise<SearchResult[]> {
  let vectorLiteral: string | null = null;
  try {
    const embedding = await embed(queryText);
    vectorLiteral = `[${embedding.join(",")}]`;
  } catch {
    // Ollama unavailable — fall back to FTS-only
  }

  const ftsResults = await query<Row>(
    `SELECT
       r.id            AS rule_id,
       r.workflow_id,
       w.name          AS workflow_name,
       w.department,
       r.summary,
       r.detail,
       r.rule_type,
       r.confidence,
       r.stakeholder_validated,
       r.owner_name,
       r.owner_email
     FROM rules r
     JOIN workflows w ON w.id = r.workflow_id
     WHERE to_tsvector('english', coalesce(r.summary,'') || ' ' || coalesce(r.detail,''))
           @@ plainto_tsquery('english', $1)
     ORDER BY ts_rank(
       to_tsvector('english', coalesce(r.summary,'') || ' ' || coalesce(r.detail,'')),
       plainto_tsquery('english', $1)
     ) DESC
     LIMIT 20`,
    [queryText]
  );

  type Row = {
    rule_id: string; workflow_id: string; workflow_name: string;
    department: string; summary: string; detail: string; rule_type: string;
    confidence: string; stakeholder_validated: boolean;
    owner_name: string | null; owner_email: string | null;
  };

  const vecResults: Row[] = vectorLiteral
    ? await query<Row>(
        `SELECT
           r.id            AS rule_id,
           r.workflow_id,
           w.name          AS workflow_name,
           w.department,
           r.summary,
           r.detail,
           r.rule_type,
           r.confidence,
           r.stakeholder_validated,
           r.owner_name,
           r.owner_email
         FROM rules r
         JOIN workflows w ON w.id = r.workflow_id
         WHERE r.embedding IS NOT NULL
         ORDER BY r.embedding <=> $1::vector
         LIMIT 20`,
        [vectorLiteral]
      )
    : [];

  // Reciprocal Rank Fusion
  const scores = new Map<string, { score: number; data: (typeof ftsResults)[0] }>();

  ftsResults.forEach((row, i) => {
    const s = 1 / (60 + i + 1);
    scores.set(row.rule_id, { score: s, data: row });
  });

  vecResults.forEach((row, i) => {
    const s = 1 / (60 + i + 1);
    const existing = scores.get(row.rule_id);
    if (existing) {
      existing.score += s;
    } else {
      scores.set(row.rule_id, { score: s, data: row });
    }
  });

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ score, data }) => ({
      ...(data as Omit<typeof data, "confidence"> & { confidence: "high" | "medium" | "low" }),
      confidence: data.confidence as "high" | "medium" | "low",
      rrf_score: score,
    }));
}
