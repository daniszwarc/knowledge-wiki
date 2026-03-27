import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  console.log("Connected to database");

  await client.query("BEGIN");

  try {
    // Enable pgvector extension
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");

    // workflows table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          VARCHAR(255) NOT NULL,
        department    VARCHAR(255) NOT NULL,
        description   TEXT,
        completeness_score INT NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // rules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rules (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workflow_id           UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
        summary               TEXT NOT NULL,
        detail                TEXT,
        rule_type             VARCHAR(100),
        confidence            VARCHAR(20) CHECK (confidence IN ('high', 'medium', 'low')),
        stakeholder_validated BOOLEAN NOT NULL DEFAULT false,
        stakeholder_notes     TEXT,
        owner_email           VARCHAR(255),
        owner_name            VARCHAR(255),
        source                VARCHAR(255),
        extracted_at          TIMESTAMPTZ DEFAULT now(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
        embedding             vector(768)
      )
    `);

    // experts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS experts (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) NOT NULL UNIQUE,
        department  VARCHAR(255) NOT NULL,
        domains     TEXT[] NOT NULL DEFAULT '{}',
        risk_level  VARCHAR(20) CHECK (risk_level IN ('critical', 'high', 'medium', 'low')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // gaps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gaps (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_id     UUID REFERENCES rules(id) ON DELETE SET NULL,
        workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
        reason      TEXT NOT NULL,
        flagged_by  VARCHAR(255),
        flagged_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        status      VARCHAR(50) NOT NULL DEFAULT 'open'
      )
    `);

    // audit_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_name     VARCHAR(100) NOT NULL,
        record_id      UUID,
        action         VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
        changed_by     VARCHAR(255) NOT NULL DEFAULT 'system',
        changed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        previous_value JSONB,
        new_value      JSONB
      )
    `);

    // Trigger function for audit logging
    await client.query(`
      CREATE OR REPLACE FUNCTION audit_trigger_fn()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          INSERT INTO audit_log(table_name, record_id, action, new_value)
          VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO audit_log(table_name, record_id, action, previous_value, new_value)
          VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO audit_log(table_name, record_id, action, previous_value)
          VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Audit trigger on rules
    await client.query(`
      DROP TRIGGER IF EXISTS audit_rules_trigger ON rules
    `);
    await client.query(`
      CREATE TRIGGER audit_rules_trigger
      AFTER INSERT OR UPDATE OR DELETE ON rules
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn()
    `);

    // Audit trigger on workflows
    await client.query(`
      DROP TRIGGER IF EXISTS audit_workflows_trigger ON workflows
    `);
    await client.query(`
      CREATE TRIGGER audit_workflows_trigger
      AFTER INSERT OR UPDATE OR DELETE ON workflows
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn()
    `);

    // Index for vector similarity search
    await client.query(`
      CREATE INDEX IF NOT EXISTS rules_embedding_idx
      ON rules USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);

    // Index for full-text search
    await client.query(`
      CREATE INDEX IF NOT EXISTS rules_fts_idx
      ON rules USING GIN (to_tsvector('english', coalesce(summary, '') || ' ' || coalesce(detail, '')))
    `);

    // users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL DEFAULT 'viewer'
          CHECK (role IN ('viewer', 'validator', 'editor', 'admin')),
        totp_secret   TEXT,
        totp_enabled  BOOLEAN DEFAULT false,
        created_at    TIMESTAMPTZ DEFAULT now(),
        last_login    TIMESTAMPTZ,
        created_by    TEXT
      )
    `);

    // sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash  TEXT UNIQUE NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT now(),
        ip_address  TEXT
      )
    `);

    // temp_tokens table for TOTP setup/verify flow
    await client.query(`
      CREATE TABLE IF NOT EXISTS temp_tokens (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash    TEXT UNIQUE NOT NULL,
        totp_secret   TEXT,
        expires_at    TIMESTAMPTZ NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT now()
      )
    `);

    // articles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title           TEXT NOT NULL,
        department      TEXT,
        workflow_name   TEXT,
        content         TEXT NOT NULL,
        source_filename TEXT,
        source_url      TEXT,
        created_at      TIMESTAMPTZ DEFAULT now(),
        created_by      TEXT DEFAULT 'pipeline',
        embedding       vector(768)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS articles_embedding_idx
      ON articles USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);

    // Validation columns on articles
    await client.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS stakeholder_validated boolean DEFAULT false`);
    await client.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS validated_by text`);
    await client.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS validated_at timestamptz`);

    // Audit trigger on articles
    await client.query(`DROP TRIGGER IF EXISTS audit_articles_trigger ON articles`);
    await client.query(`
      CREATE TRIGGER audit_articles_trigger
      AFTER INSERT OR UPDATE OR DELETE ON articles
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn()
    `);

    await client.query("COMMIT");
    console.log("Migration completed successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed, rolled back:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
