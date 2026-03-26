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
