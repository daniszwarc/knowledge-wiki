import { Client } from "pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function seed() {
  await client.connect();
  const hash = await bcrypt.hash("Admin1234!", 12);
  await client.query(
    `INSERT INTO users (email, password_hash, role, totp_enabled, created_by)
     VALUES ($1, $2, 'admin', false, 'seed')
     ON CONFLICT (email) DO NOTHING`,
    ["admin@company.com", hash]
  );
  console.log("Admin user seeded (admin@company.com / Admin1234!)");
  await client.end();
}

seed().catch((e) => { console.error(e); process.exit(1); });
