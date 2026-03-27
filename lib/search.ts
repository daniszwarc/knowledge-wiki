import { query } from "./db";
import { embed } from "./ollama";

export interface RuleSearchResult {
  type: "rule";
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

export interface ArticleSearchResult {
  type: "article";
  article_id: string;
  title: string;
  department: string | null;
  snippet: string;
  rrf_score: number;
}

export type SearchResult = RuleSearchResult | ArticleSearchResult;

// Keep legacy alias for backward compatibility
export type { RuleSearchResult as LegacySearchResult };

type RuleRow = {
  rule_id: string; workflow_id: string; workflow_name: string;
  department: string; summary: string; detail: string; rule_type: string;
  confidence: string; stakeholder_validated: boolean;
  owner_name: string | null; owner_email: string | null;
};

type ArticleRow = {
  article_id: string; title: string; department: string | null; content: string;
};

export async function hybridSearch(queryText: string): Promise<SearchResult[]> {
  let vectorLiteral: string | null = null;
  try {
    const embedding = await embed(queryText);
    vectorLiteral = `[${embedding.join(",")}]`;
  } catch {
    // Ollama unavailable — fall back to FTS-only
  }

  // ── Rule FTS ──────────────────────────────────────────────────────────────
  const ruleFts = await query<RuleRow>(
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

  // ── Rule vector ───────────────────────────────────────────────────────────
  const ruleVec: RuleRow[] = vectorLiteral
    ? await query<RuleRow>(
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

  // ── Article FTS ───────────────────────────────────────────────────────────
  const articleFts = await query<ArticleRow>(
    `SELECT id AS article_id, title, department,
            left(content, 400) AS content
     FROM articles
     WHERE to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
           @@ plainto_tsquery('english', $1)
     ORDER BY ts_rank(
       to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')),
       plainto_tsquery('english', $1)
     ) DESC
     LIMIT 20`,
    [queryText]
  );

  // ── Article vector ────────────────────────────────────────────────────────
  const articleVec: ArticleRow[] = vectorLiteral
    ? await query<ArticleRow>(
        `SELECT id AS article_id, title, department,
                left(content, 400) AS content
         FROM articles
         WHERE embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT 20`,
        [vectorLiteral]
      )
    : [];

  // ── RRF over rules ────────────────────────────────────────────────────────
  const ruleScores = new Map<string, { score: number; data: RuleRow }>();
  ruleFts.forEach((row, i) => {
    ruleScores.set(row.rule_id, { score: 1 / (60 + i + 1), data: row });
  });
  ruleVec.forEach((row, i) => {
    const s = 1 / (60 + i + 1);
    const existing = ruleScores.get(row.rule_id);
    if (existing) existing.score += s;
    else ruleScores.set(row.rule_id, { score: s, data: row });
  });

  // ── RRF over articles ─────────────────────────────────────────────────────
  const articleScores = new Map<string, { score: number; data: ArticleRow }>();
  articleFts.forEach((row, i) => {
    articleScores.set(row.article_id, { score: 1 / (60 + i + 1), data: row });
  });
  articleVec.forEach((row, i) => {
    const s = 1 / (60 + i + 1);
    const existing = articleScores.get(row.article_id);
    if (existing) existing.score += s;
    else articleScores.set(row.article_id, { score: s, data: row });
  });

  // ── Merge and rank ────────────────────────────────────────────────────────
  const combined: SearchResult[] = [
    ...Array.from(ruleScores.values()).map(({ score, data }) => ({
      type: "rule" as const,
      ...data,
      confidence: data.confidence as "high" | "medium" | "low",
      rrf_score: score,
    })),
    ...Array.from(articleScores.values()).map(({ score, data }) => ({
      type: "article" as const,
      article_id: data.article_id,
      title: data.title,
      department: data.department,
      snippet: data.content,
      rrf_score: score,
    })),
  ];

  return combined.sort((a, b) => b.rrf_score - a.rrf_score).slice(0, 15);
}
