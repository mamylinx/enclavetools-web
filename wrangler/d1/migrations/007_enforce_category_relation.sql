UPDATE tools SET category = 'code-assistants' WHERE category = 'code-generation';
UPDATE tools SET category = 'data-utilities' WHERE category = 'data-processing';

PRAGMA foreign_keys = OFF;

CREATE TABLE tools_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  url TEXT,
  github_url TEXT,
  category TEXT,
  license TEXT,
  language TEXT,
  hardware TEXT,
  deployment TEXT,
  model_format TEXT,
  maturity TEXT,
  featured INTEGER DEFAULT 0,
  popularity_score INTEGER DEFAULT 0,
  date_added TEXT,
  last_updated TEXT,
  logo_source TEXT DEFAULT 'google',
  created_at TEXT,
  plain_description TEXT,
  technical_description TEXT,
  commercial_use INTEGER,
  setup_difficulty TEXT,
  use_cases TEXT,
  personas TEXT,
  features TEXT,
  works_with TEXT,
  docs_url TEXT,
  community_guides TEXT,
  community_notes TEXT,
  min_ram_gb INTEGER,
  recommended_ram_gb INTEGER,
  telemetry TEXT DEFAULT 'None',
  offline_after_setup INTEGER DEFAULT 1,
  paid_support INTEGER DEFAULT 0,
  gui_available INTEGER DEFAULT 0,
  docker_available INTEGER DEFAULT 0,
  openai_api INTEGER DEFAULT 0,
  rest_api INTEGER DEFAULT 0,
  fine_tuning INTEGER DEFAULT 0,
  quantization INTEGER DEFAULT 0,
  community_notes_count INTEGER DEFAULT 0,
  community_guides_count INTEGER DEFAULT 0,
  last_verified TEXT,
  FOREIGN KEY (category) REFERENCES categories(slug) ON DELETE SET NULL
);

INSERT INTO tools_new SELECT * FROM tools;

DROP TABLE tools;

ALTER TABLE tools_new RENAME TO tools;

PRAGMA foreign_keys = ON;
