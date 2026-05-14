import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function embedText(text: string): Promise<number[]> {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/v1$/, '');
  const model = process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text';
  const apiKey = process.env.LLM_API_KEY ?? 'ollama';
  const isRemote = apiKey !== 'ollama' && !baseUrl.includes('localhost');

  if (isRemote) {
    const res = await fetch(`${baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: [text], encoding_format: 'float' }),
    });
    if (!res.ok) throw new Error(`Embed failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.data[0].embedding;
  } else {
    const res = await fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: text }),
    });
    if (!res.ok) throw new Error(`Embed failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const vector = data.embeddings?.[0] ?? data.embedding;
    if (!vector || vector.length === 0) throw new Error('Empty embedding returned');
    return vector;
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function backfill() {
  console.log(`Backfill started at ${new Date().toISOString()}`);

  let fixedRules = 0;
  let fixedArticles = 0;
  let fixedSeds = 0;
  let errors = 0;

  // Rules
  const { rows: rules } = await pool.query<{
    id: string;
    summary: string;
    detail: string | null;
  }>('SELECT id, summary, detail FROM rules WHERE embedding IS NULL ORDER BY extracted_at');

  for (const rule of rules) {
    const text = [rule.summary, rule.detail].filter(Boolean).join(' ');
    const idShort = rule.id.substring(0, 8);
    try {
      const vector = await embedText(text);
      const literal = `[${vector.join(',')}]`;
      await pool.query(
        'UPDATE rules SET embedding = $1::vector, updated_at = now() WHERE id = $2',
        [literal, rule.id]
      );
      console.log(`[rules] ${idShort} — ${rule.summary}`);
      fixedRules++;
    } catch (e) {
      console.error(`[rules] ${idShort} ERROR — ${rule.summary}:`, e);
      errors++;
    }
    await delay(2000);
  }

  // Articles
  const { rows: articles } = await pool.query<{
    id: string;
    title: string;
    content: string;
  }>('SELECT id, title, content FROM articles WHERE embedding IS NULL ORDER BY created_at');

  for (const article of articles) {
    const text = `${article.title} ${article.content.substring(0, 1000)}`;
    const idShort = article.id.substring(0, 8);
    try {
      const vector = await embedText(text);
      const literal = `[${vector.join(',')}]`;
      await pool.query(
        'UPDATE articles SET embedding = $1::vector WHERE id = $2',
        [literal, article.id]
      );
      console.log(`[articles] ${idShort} — ${article.title}`);
      fixedArticles++;
    } catch (e) {
      console.error(`[articles] ${idShort} ERROR — ${article.title}:`, e);
      errors++;
    }
    await delay(2000);
  }

  // SEDs
  const { rows: seds } = await pool.query<{
    id: string;
    ticket_number: string;
    project_title: string;
    business_requirements: string | null;
    it_design: string | null;
  }>('SELECT id, ticket_number, project_title, business_requirements, it_design FROM seds WHERE embedding IS NULL');

  for (const sed of seds) {
    const text = [sed.ticket_number, sed.project_title, sed.business_requirements, sed.it_design]
      .filter(Boolean)
      .join(' ')
      .substring(0, 2000);
    const idShort = sed.id.substring(0, 8);
    try {
      const vector = await embedText(text);
      const literal = `[${vector.join(',')}]`;
      await pool.query(
        'UPDATE seds SET embedding = $1::vector WHERE id = $2',
        [literal, sed.id]
      );
      console.log(`[seds] ${idShort} — ${sed.project_title}`);
      fixedSeds++;
    } catch (e) {
      console.error(`[seds] ${idShort} ERROR — ${sed.project_title}:`, e);
      errors++;
    }
    await delay(2000);
  }

  await pool.end();

  console.log(
    `Backfill complete. Fixed: ${fixedRules} rules, ${fixedArticles} articles, ${fixedSeds} seds. Errors: ${errors}`
  );

  process.exit(errors > 0 ? 1 : 0);
}

backfill().catch(err => {
  console.error('Backfill fatal error:', err);
  process.exit(1);
});
