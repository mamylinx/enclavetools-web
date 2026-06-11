-- 002_simplify_pending_tools.sql
-- Simplify pending_tools to only store submission metadata.
-- Extended tool data is entered directly into the tools table via admin script.

CREATE TABLE IF NOT EXISTS pending_tools_new (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'pending',
  explanation TEXT,
  submitted_at TEXT,
  reviewed_at TEXT
);

INSERT INTO pending_tools_new (id, url, status, submitted_at, reviewed_at)
SELECT
  id,
  COALESCE(NULLIF(url, ''), NULLIF(github_url, ''), ''),
  status,
  submitted_at,
  reviewed_at
FROM pending_tools;

DROP TABLE IF EXISTS pending_tools;

ALTER TABLE pending_tools_new RENAME TO pending_tools;
