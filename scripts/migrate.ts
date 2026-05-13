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
        changed_by     VARCHAR(255) NOT NULL,
        changed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        previous_value JSONB,
        new_value      JSONB
      )
    `);

    // Remove DB-level audit triggers — all audit_log inserts are done
    // explicitly in application code with the authenticated user's email.
    await client.query(`DROP TRIGGER IF EXISTS audit_rules_trigger ON rules`);
    await client.query(`DROP TRIGGER IF EXISTS audit_workflows_trigger ON workflows`);
    await client.query(`DROP TRIGGER IF EXISTS audit_articles_trigger ON articles`);
    await client.query(`DROP FUNCTION IF EXISTS audit_trigger_fn CASCADE`);

    // Index for vector similarity search (skipped for >2000 dims)
    await client.query(`SAVEPOINT before_rules_idx`);
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS rules_embedding_idx
        ON rules USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);
    } catch { await client.query(`ROLLBACK TO SAVEPOINT before_rules_idx`); }

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
          CHECK (role IN ('viewer', 'validator', 'editor', 'admin', 'developer')),
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

    await client.query(`SAVEPOINT before_articles_idx`);
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS articles_embedding_idx
        ON articles USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);
    } catch { await client.query(`ROLLBACK TO SAVEPOINT before_articles_idx`); }

    // Process narrative columns on workflows
    await client.query(`ALTER TABLE workflows ADD COLUMN IF NOT EXISTS process_narrative text`);
    await client.query(`ALTER TABLE workflows ADD COLUMN IF NOT EXISTS narrative_generated_at timestamptz`);

    // Validation columns on articles
    await client.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS stakeholder_validated boolean DEFAULT false`);
    await client.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS validated_by text`);
    await client.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS validated_at timestamptz`);

    // Audit trigger on articles — removed, audit is handled in application code
    await client.query(`DROP TRIGGER IF EXISTS audit_articles_trigger ON articles`);

    // article_type column
    await client.query(`
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS
        article_type text DEFAULT 'how_to_guide'
        CHECK (article_type IN ('how_to_guide', 'training_material'))
    `);

    // appears_as — multi-value section tagging (replaces article_type for nav)
    await client.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS appears_as TEXT[]`);
    await client.query(`
      UPDATE articles
      SET appears_as = ARRAY[article_type]
      WHERE appears_as IS NULL AND article_type IS NOT NULL
    `);
    await client.query(`
      UPDATE articles
      SET appears_as = ARRAY['how_to_guide']
      WHERE appears_as IS NULL
    `);
    await client.query(`ALTER TABLE articles ALTER COLUMN appears_as SET DEFAULT ARRAY['how_to_guide']`);

    // Expand role CHECK constraint to include 'developer', 'super_admin', 'company_admin'
    await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await client.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('viewer', 'validator', 'editor', 'admin', 'developer', 'super_admin', 'company_admin'))
    `);

    // seds table
    await client.query(`
      CREATE TABLE IF NOT EXISTS seds (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number        VARCHAR(100) UNIQUE NOT NULL,
        project_title        TEXT NOT NULL,
        department           VARCHAR(255),
        author               VARCHAR(255),
        date                 DATE,
        affected_systems     TEXT,
        business_requirements TEXT,
        it_design            TEXT,
        unit_testing         TEXT,
        acceptance_testing   TEXT,
        raw_content          TEXT,
        source_filename      VARCHAR(255),
        embedding            vector(768),
        created_by           VARCHAR(255),
        created_at           TIMESTAMPTZ DEFAULT NOW(),
        updated_at           TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`SAVEPOINT before_seds_idx`);
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS seds_embedding_idx
        ON seds USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);
    } catch { await client.query(`ROLLBACK TO SAVEPOINT before_seds_idx`); }

    // Add structured metadata columns to seds
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS inc_ticket VARCHAR(100)`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS cab_ticket VARCHAR(100)`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS story_number VARCHAR(100)`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS td_oms_task VARCHAR(100)`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS requestor VARCHAR(255)`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS programmer VARCHAR(255)`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS contributors TEXT`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS approved_by TEXT`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS company VARCHAR(255)`);

    // story_number is now the primary unique identifier for SEDs
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'seds_story_number_key'
        ) THEN
          ALTER TABLE seds ADD CONSTRAINT seds_story_number_key UNIQUE (story_number);
        END IF;
      END $$
    `);

    // Image arrays per section for SED documents
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS business_requirements_images JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS it_design_images JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS unit_testing_images JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS acceptance_testing_images JSONB DEFAULT '[]'`);

    // Interleaved content (text+image in document order) per section
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS business_requirements_content JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS it_design_content JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS unit_testing_content JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS acceptance_testing_content JSONB DEFAULT '[]'`);

    // Companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name       VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(255)
      )
    `);

    // Junction table: users belong to one or more companies
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_companies (
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, company_id)
      )
    `);

    // Add company_id / is_corporate to content tables
    await client.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id)`);
    await client.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_corporate BOOLEAN DEFAULT false`);

    await client.query(`ALTER TABLE rules ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id)`);
    await client.query(`ALTER TABLE rules ADD COLUMN IF NOT EXISTS is_corporate BOOLEAN DEFAULT false`);

    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id)`);
    await client.query(`ALTER TABLE seds ADD COLUMN IF NOT EXISTS is_corporate BOOLEAN DEFAULT false`);

    await client.query(`ALTER TABLE workflows ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id)`);
    await client.query(`ALTER TABLE workflows ADD COLUMN IF NOT EXISTS is_corporate BOOLEAN DEFAULT false`);

    // Add company_number reference field
    await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_number INTEGER UNIQUE`);

    // Seed initial companies (legacy placeholders)
    await client.query(`
      INSERT INTO companies (name) VALUES
        ('APi Group Corporate'),
        ('Western States'),
        ('Vipond')
      ON CONFLICT (name) DO NOTHING
    `);

    // Seed APi Group subsidiary companies
    const seedResult = await client.query(`
      INSERT INTO companies (company_number, name) VALUES
        (1,   'API Group Inc.'),
        (3,   'API Real Estate LLC'),
        (4,   'API Group Corp.'),
        (5,   'API Group DE Inc.'),
        (7,   'Northland Post Sale'),
        (9,   'Olsen Fire Protection'),
        (10,  'A.P.I. Incorporated'),
        (12,  'NYCO Inc.'),
        (14,  'Classic Industrial Services'),
        (15,  'Industrial Contractors'),
        (19,  'Tessiers Inc.'),
        (20,  'Jamar Company'),
        (23,  'United Piping Inc.'),
        (25,  'Viking Auto Sprinkler Co.'),
        (26,  'VFP Fire Systems Inc.'),
        (27,  'API National Service Group'),
        (31,  'K&M Fire NYC LLC'),
        (34,  'Island Fire Sprinkler Inc.'),
        (41,  'International Fire'),
        (43,  'Security Fire Protection'),
        (46,  'USA Fire Protection Inc.'),
        (48,  'API Intl LLC'),
        (50,  'Lejeune Steel Company'),
        (55,  'API Group Life Safety US'),
        (57,  'Nexus'),
        (65,  'API Garage Door Inc.'),
        (67,  'API International Hong Kong'),
        (68,  'API International Macau'),
        (69,  'Residential Design LLC'),
        (72,  'Jomax Construction'),
        (73,  '3S Inc.'),
        (74,  'K&M Fire Protection'),
        (80,  'Vipond Inc.'),
        (81,  'M&N Energy Services Ltd.'),
        (82,  'Direct Fire Protection'),
        (83,  'M&N Construction Ltd.'),
        (84,  'Forbes Fire Protection'),
        (86,  'API Group Holding Canada'),
        (87,  'Train Oilfield Services'),
        (88,  'CanAm Fire Protection Inc.'),
        (89,  'Atlantic Alarm & Sound'),
        (90,  'Chubb Fire & Security Ltd.'),
        (101, 'API Group Swiss Finco LM'),
        (102, 'API Group Finance Inc.'),
        (103, 'API Group Finco Limited'),
        (104, 'API Group Finco Ltd US'),
        (118, 'Tenet'),
        (130, 'Summit Pipeline Services'),
        (134, 'Chubb Canada'),
        (135, 'API NSG Canada'),
        (140, 'API Aviation LLC'),
        (149, 'Architekton Partners'),
        (155, 'Kandor Company')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log(`Inserted ${seedResult.rowCount} new subsidiary companies`);

    // Clear existing articles
    await client.query(`DELETE FROM articles`);

    // Migrate embedding columns from vector(768) to vector(4096)
    // Clear embeddings first — 768-dim vectors are incompatible with 4096-dim
    await client.query(`UPDATE rules SET embedding = NULL`);
    await client.query(`UPDATE articles SET embedding = NULL`);
    await client.query(`UPDATE seds SET embedding = NULL`);

    // Drop existing ivfflat indexes before altering column type
    // (ivfflat and hnsw both cap at 2000 dims — indexes are skipped for 4096-dim vectors;
    //  searches use exact KNN which is accurate but O(n). Re-add indexes if you upgrade
    //  to a pgvector build that supports >2000 dimensions.)
    await client.query(`DROP INDEX IF EXISTS rules_embedding_idx`);
    await client.query(`DROP INDEX IF EXISTS articles_embedding_idx`);
    await client.query(`DROP INDEX IF EXISTS seds_embedding_idx`);

    // Alter column types to 4096 dimensions
    await client.query(`ALTER TABLE rules ALTER COLUMN embedding TYPE vector(4096)`);
    await client.query(`ALTER TABLE articles ALTER COLUMN embedding TYPE vector(4096)`);
    await client.query(`ALTER TABLE seds ALTER COLUMN embedding TYPE vector(4096)`);

    console.log("Embedding columns migrated to vector(4096) — no ANN indexes (pgvector ivfflat/hnsw cap at 2000 dims)");

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
