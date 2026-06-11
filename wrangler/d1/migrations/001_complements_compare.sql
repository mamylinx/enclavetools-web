-- 001_complements_compare.sql
-- Adds complements and compare_rows tables for tool relationship + comparison config.
-- Seeds existing data from hand-maintained JSON files.

CREATE TABLE IF NOT EXISTS complements (
  category_slug TEXT PRIMARY KEY,
  complements TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_slug) REFERENCES categories(slug) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS compare_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  field_key TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(field_key)
);

INSERT OR IGNORE INTO complements (category_slug, complements) VALUES
  ('llm-inference', '["chat-interfaces","rag-document","deployment","monitoring-observability"]'),
  ('llm-models', '["llm-inference","chat-interfaces","fine-tuning-training"]'),
  ('chat-interfaces', '["llm-inference","llm-models","rag-document"]'),
  ('rag-document', '["vector-databases","embedding-models","llm-inference","chat-interfaces"]'),
  ('vector-databases', '["embedding-models","rag-document"]'),
  ('embedding-models', '["vector-databases","rag-document"]'),
  ('fine-tuning-training', '["llm-models","deployment","monitoring-observability"]'),
  ('workflow-automation', '["agent-frameworks","chat-interfaces","rag-document"]'),
  ('agent-frameworks', '["llm-inference","workflow-automation","monitoring-observability"]');

INSERT OR IGNORE INTO compare_rows (label, field_key, sort_order) VALUES
  ('License', 'license', 0),
  ('Commercial use', 'commercial_use', 1),
  ('Setup difficulty', 'setup_difficulty', 2),
  ('GitHub stars', 'popularity_score', 3),
  ('Last updated', 'last_updated', 4),
  ('OpenAI API', 'openai_api', 5),
  ('REST API', 'rest_api', 6),
  ('Fine-tuning', 'fine_tuning', 7),
  ('Quantization', 'quantization', 8),
  ('Docker', 'docker_available', 9),
  ('GUI / no-code', 'gui_available', 10),
  ('Offline after setup', 'offline_after_setup', 11),
  ('Telemetry', 'telemetry', 12),
  ('Minimum RAM', 'min_ram_gb', 13),
  ('Recommended RAM', 'recommended_ram_gb', 14),
  ('Hardware', 'hardware', 15),
  ('Deployment', 'deployment', 16),
  ('Model format', 'model_format', 17);
