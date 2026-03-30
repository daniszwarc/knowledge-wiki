import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const DELAY_MS = 3000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows } = await client.query<{ id: string; name: string }>(`
    SELECT w.id, w.name
    FROM workflows w
    WHERE w.process_narrative IS NULL
      AND EXISTS (SELECT 1 FROM rules r WHERE r.workflow_id = w.id)
    ORDER BY w.name
  `);

  await client.end();

  if (rows.length === 0) {
    console.log("No workflows need narrative generation.");
    return;
  }

  console.log(`Found ${rows.length} workflow(s) without a narrative.`);

  for (let i = 0; i < rows.length; i++) {
    const { id, name } = rows[i];
    console.log(`[${i + 1}/${rows.length}] Generating narrative for: ${name} (${id})`);

    try {
      const res = await fetch(`${BASE_URL}/api/workflows/${id}/generate-narrative`, {
        method: "POST",
      });
      if (res.ok) {
        console.log(`  ✓ Done`);
      } else {
        const body = await res.text();
        console.error(`  ✗ Failed (${res.status}): ${body}`);
      }
    } catch (err) {
      console.error(`  ✗ Error:`, err);
    }

    if (i < rows.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
