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

export interface SedSearchResult {
  type: "sed";
  id: string;
  ticket_number: string;
  project_title: string;
  department: string | null;
  snippet: string;
  rrf_score: number;
}

export type SearchResult = RuleSearchResult | ArticleSearchResult | SedSearchResult;

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

type SedRow = {
  id: string; ticket_number: string; project_title: string;
  department: string | null; snippet: string;
};

export async function hybridSearch(queryText: string, companyIds?: string[]): Promise<SearchResult[]> {
  let vectorLiteral: string | null = null;
  try {
    const embedding = await embed(queryText);
    vectorLiteral = `[${embedding.join(",")}]`;
  } catch {
    // Ollama unavailable — fall back to FTS-only
  }

  // Company filter fragment — appended to WHERE clauses when companyIds provided
  const cf = companyIds
    ? "AND (company_id IS NULL OR is_corporate = true OR company_id = ANY($2::uuid[]))"
    : "";
  const wfCf = companyIds
    ? "AND (w.company_id IS NULL OR w.is_corporate = true OR w.company_id = ANY($2::uuid[]))"
    : "";
  const cfParams = (base: unknown[]) => (companyIds ? [...base, companyIds] : base);

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
           @@ plainto_tsquery('english', $1) ${wfCf}
     ORDER BY ts_rank(
       to_tsvector('english', coalesce(r.summary,'') || ' ' || coalesce(r.detail,'')),
       plainto_tsquery('english', $1)
     ) DESC
     LIMIT 20`,
    cfParams([queryText])
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
         WHERE r.embedding IS NOT NULL ${wfCf}
         ORDER BY r.embedding <=> $1::vector
         LIMIT 20`,
        cfParams([vectorLiteral])
      )
    : [];

  // ── Article FTS ───────────────────────────────────────────────────────────
  const articleFts = await query<ArticleRow>(
    `SELECT id AS article_id, title, department,
            left(content, 400) AS content
     FROM articles
     WHERE to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
           @@ plainto_tsquery('english', $1) ${cf}
     ORDER BY ts_rank(
       to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')),
       plainto_tsquery('english', $1)
     ) DESC
     LIMIT 20`,
    cfParams([queryText])
  );

  // ── Article vector ────────────────────────────────────────────────────────
  const articleVec: ArticleRow[] = vectorLiteral
    ? await query<ArticleRow>(
        `SELECT id AS article_id, title, department,
                left(content, 400) AS content
         FROM articles
         WHERE embedding IS NOT NULL ${cf}
         ORDER BY embedding <=> $1::vector
         LIMIT 20`,
        cfParams([vectorLiteral])
      )
    : [];

  // ── SED FTS ───────────────────────────────────────────────────────────────
  const sedFts = await query<SedRow>(
    `SELECT id, ticket_number, project_title, department,
            left(coalesce(business_requirements, ''), 200) AS snippet
     FROM seds
     WHERE to_tsvector('english',
             coalesce(ticket_number,'') || ' ' ||
             coalesce(project_title,'') || ' ' ||
             coalesce(business_requirements,''))
           @@ plainto_tsquery('english', $1) ${cf}
     ORDER BY ts_rank(
       to_tsvector('english',
         coalesce(ticket_number,'') || ' ' ||
         coalesce(project_title,'') || ' ' ||
         coalesce(business_requirements,'')),
       plainto_tsquery('english', $1)
     ) DESC
     LIMIT 20`,
    cfParams([queryText])
  );

  // ── SED vector ────────────────────────────────────────────────────────────
  const sedVec: SedRow[] = vectorLiteral
    ? await query<SedRow>(
        `SELECT id, ticket_number, project_title, department,
                left(coalesce(business_requirements, ''), 200) AS snippet
         FROM seds
         WHERE embedding IS NOT NULL ${cf}
         ORDER BY embedding <=> $1::vector
         LIMIT 20`,
        cfParams([vectorLiteral])
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

  // ── RRF over SEDs ─────────────────────────────────────────────────────────
  const sedScores = new Map<string, { score: number; data: SedRow }>();
  sedFts.forEach((row, i) => {
    sedScores.set(row.id, { score: 1 / (60 + i + 1), data: row });
  });
  sedVec.forEach((row, i) => {
    const s = 1 / (60 + i + 1);
    const existing = sedScores.get(row.id);
    if (existing) existing.score += s;
    else sedScores.set(row.id, { score: s, data: row });
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
    ...Array.from(sedScores.values()).map(({ score, data }) => ({
      type: "sed" as const,
      id: data.id,
      ticket_number: data.ticket_number,
      project_title: data.project_title,
      department: data.department,
      snippet: data.snippet,
      rrf_score: score,
    })),
  ];

  return combined.sort((a, b) => b.rrf_score - a.rrf_score).slice(0, 15);
}
