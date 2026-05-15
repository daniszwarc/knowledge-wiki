CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  transcript TEXT NOT NULL,
  content TEXT,
  overview TEXT,
  toc JSONB,
  company_id UUID REFERENCES companies(id),
  is_corporate BOOLEAN DEFAULT true,
  validated_by TEXT,
  validated_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  embedding vector(4096)
);

CREATE INDEX IF NOT EXISTS idx_videos_department ON videos(department);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
