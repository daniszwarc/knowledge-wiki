import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function regenerate() {
  const { rows } = await pool.query(
    'SELECT id, summary, detail FROM rules ORDER BY extracted_at'
  );
  
  console.log(`Found ${rows.length} rules to embed`);
  
  for (let i = 0; i < rows.length; i++) {
    const rule = rows[i];
    const text = `${rule.summary} ${rule.detail || ''}`;
    
    try {
      const res = await fetch('http://localhost:3000/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: rule.id, text })
      });
      
      const data = await res.json();
      console.log(`[${i+1}/${rows.length}] ${res.ok ? 'OK' : 'FAIL'} — ${rule.summary}`);
      if (!res.ok) console.log('  Error:', JSON.stringify(data));
    } catch (e) {
      console.log(`[${i+1}/${rows.length}] ERROR — ${rule.summary}:`, e);
    }
  }
  
  await pool.end();
  console.log('Done');
}

regenerate();

async function regenerateArticles() {
  const { rows } = await pool.query(
    'SELECT id, title, content FROM articles ORDER BY created_at'
  );
  
  console.log(`Found ${rows.length} articles to embed`);
  
  for (let i = 0; i < rows.length; i++) {
    const article = rows[i];
    const text = `${article.title} ${article.content.substring(0, 1000)}`;
    
    try {
      const res = await fetch('http://localhost:3000/api/articles/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id, text })
      });
      
      const data = await res.json();
      console.log(`[${i+1}/${rows.length}] ${res.ok ? 'OK' : 'FAIL'} — ${article.title}`);
      if (!res.ok) console.log('  Error:', JSON.stringify(data));
    } catch (e) {
      console.log(`[${i+1}/${rows.length}] ERROR — ${article.title}:`, e);
    }
  }
}

regenerateArticles();

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

async function regenerateSeds() {
  const { rows } = await pool.query(
    'SELECT id, ticket_number, project_title, business_requirements, it_design FROM seds WHERE embedding IS NULL'
  );

  console.log(`Found ${rows.length} SEDs to embed`);

  for (let i = 0; i < rows.length; i++) {
    const sed = rows[i];
    const text = [sed.ticket_number, sed.project_title, sed.business_requirements, sed.it_design]
      .filter(Boolean)
      .join(' ')
      .substring(0, 2000);

    try {
      const vector = await embedText(text);
      const literal = `[${vector.join(',')}]`;
      await pool.query('UPDATE seds SET embedding = $1::vector WHERE id = $2', [literal, sed.id]);
      console.log(`[${i + 1}/${rows.length}] OK — ${sed.project_title}`);
    } catch (e) {
      console.log(`[${i + 1}/${rows.length}] ERROR — ${sed.project_title}:`, e);
    }
  }
}

regenerateSeds();
