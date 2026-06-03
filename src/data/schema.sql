-- =============================================================
-- enclavetools.com — Database Schema Reference
-- Generated from wrangler/d1/migrations/
-- Last updated: 2026-06-03
-- =============================================================

-- Tools table (core)
CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  url TEXT,
  github_url TEXT,
  category TEXT,
  license TEXT,
  language TEXT,              -- JSON array string
  hardware TEXT,              -- JSON array string
  deployment TEXT,            -- JSON array string
  model_format TEXT,          -- JSON array string
  maturity TEXT,
  featured INTEGER DEFAULT 0,
  popularity_score INTEGER DEFAULT 0,
  date_added TEXT,
  last_updated TEXT,
  logo_source TEXT DEFAULT 'google',
  created_at TEXT,

  -- Extended fields (migration 005 / 007)
  plain_description TEXT,
  technical_description TEXT,
  commercial_use INTEGER,
  setup_difficulty TEXT,
  use_cases TEXT,             -- JSON array string
  personas TEXT,              -- JSON array string
  features TEXT,              -- JSON array string
  works_with TEXT,            -- JSON array string
  docs_url TEXT,
  community_guides TEXT,      -- JSON array string
  community_notes TEXT,       -- JSON array string
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

-- Pending tools (submissions awaiting approval)
CREATE TABLE IF NOT EXISTS pending_tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
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
  logo_r2_key TEXT,
  github_data TEXT,           -- JSON string
  status TEXT DEFAULT 'pending',
  submitted_at TEXT,
  reviewed_at TEXT,

  -- Extended fields (migration 008)
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
  last_verified TEXT
);

-- Categories (migration 006)
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Site-wide content strings (migration 009)
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Marketing cards (featured, promoted, sponsors) (migration 009)
CREATE TABLE IF NOT EXISTS marketing_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('featured', 'promoted', 'sponsor')),
  label TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cta TEXT,
  url TEXT,
  logo TEXT,
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Filter dimension options (migration 009)
CREATE TABLE IF NOT EXISTS filter_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_key TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Category metadata (icons, descriptions, SEO) (migration 009)
CREATE TABLE IF NOT EXISTS category_meta (
  category_slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  og_image TEXT,
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Legal pages (privacy, terms) (migration 009)
CREATE TABLE IF NOT EXISTS legal_pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
