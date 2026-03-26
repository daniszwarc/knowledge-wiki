import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  console.log("Connected to database");
  try {
    await client.query("ALTER TABLE rules ADD COLUMN IF NOT EXISTS source_url text");
    console.log("Added source_url column to rules table");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
