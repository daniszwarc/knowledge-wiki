-- Migration: add platform_id to articles
-- Opción C — no ORM, ALTER TABLE directo
-- Artículos existentes quedan con platform_id = NULL hasta reasignación manual

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'platform_id'
  ) THEN
    ALTER TABLE articles
      ADD COLUMN platform_id UUID REFERENCES platforms(id) ON DELETE SET NULL;

    -- Índice para queries por plataforma
    CREATE INDEX idx_articles_platform_id ON articles(platform_id);

    RAISE NOTICE 'platform_id added to articles';
  ELSE
    RAISE NOTICE 'platform_id already exists on articles — skipped';
  END IF;
END
$$;
