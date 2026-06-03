# Data Layer Unification Plan

**Date:** 2026-06-03
**Status:** Approved

## Problem Summary

The project has 6+ fragmented data sources with no single source of truth:

1. **D1 Database** (21 columns) — basic tool fields only
2. **`build-data.ts` + `toolModel.ts`** — duplicated heuristic inference filling ~35 missing fields
3. **Manual JSON files** (`featured.json`, `promoted.json`, `sponsors.json`, `newsletter.json`)
4. **Hardcoded component strings** (nav labels, CTAs, filter options, category icons, empty states, legal pages)
5. **`filterConfig.ts`** — hardcoded filter dimension options
6. **`Card.vue`** — hardcoded category→icon switch mapping

The D1 schema (21 columns) vs Application `Tool` type (56 fields) gap is the core issue.

## Solution: D1-First Unified Data Layer

All content lives in D1 tables. Build-time scripts generate static JSON files. Admin panel provides CRUD for all content types. Manual deploy hook triggers rebuild.

---

## Phase 1 — D1 Schema Expansion

### Tools Table: Add 30+ Columns

All columns default to `NULL`. Heuristic fallbacks only fire when column is `NULL`, so admin-set values always win.

```sql
-- Existing columns (21)
-- id, name, slug, description, url, github_url, category, license,
-- language, hardware, deployment, model_format, maturity, featured,
-- popularity_score, date_added, last_updated, logo_source, created_at

-- New columns to add
ALTER TABLE tools ADD COLUMN body TEXT DEFAULT NULL;
ALTER TABLE tools ADD COLUMN plain_description TEXT DEFAULT NULL;
ALTER TABLE tools ADD COLUMN technical_description TEXT DEFAULT NULL;
ALTER TABLE tools ADD COLUMN tag TEXT DEFAULT NULL;
ALTER TABLE tools ADD COLUMN docs_url TEXT DEFAULT NULL;
ALTER TABLE tools ADD COLUMN commercial_use INTEGER DEFAULT NULL;
ALTER TABLE tools ADD COLUMN setup_difficulty TEXT DEFAULT NULL;
ALTER TABLE tools ADD COLUMN use_cases TEXT DEFAULT NULL;         -- JSON array
ALTER TABLE tools ADD COLUMN personas TEXT DEFAULT NULL;           -- JSON array
ALTER TABLE tools ADD COLUMN features TEXT DEFAULT NULL;          -- JSON array
ALTER TABLE tools ADD COLUMN works_with TEXT DEFAULT NULL;        -- JSON array
ALTER TABLE tools ADD COLUMN community_guides TEXT DEFAULT NULL;  -- JSON array
ALTER TABLE tools ADD COLUMN community_notes TEXT DEFAULT NULL;   -- JSON array
ALTER TABLE tools ADD COLUMN community_guides_count INTEGER DEFAULT NULL;
ALTER TABLE tools ADD COLUMN community_notes_count INTEGER DEFAULT NULL;
ALTER TABLE tools ADD COLUMN min_ram_gb REAL DEFAULT NULL;
ALTER TABLE tools ADD COLUMN recommended_ram_gb REAL DEFAULT NULL;
ALTER TABLE tools ADD COLUMN telemetry TEXT DEFAULT NULL;
ALTER TABLE tools ADD COLUMN offline_after_setup INTEGER DEFAULT NULL;
ALTER TABLE tools ADD COLUMN paid_support INTEGER DEFAULT NULL;
ALTER TABLE tools ADD COLUMN gui_available INTEGER DEFAULT NULL;
ALTER TABLE tools ADD COLUMN docker_available INTEGER DEFAULT NULL;
ALTER TABLE tools ADD COLUMN openai_api INTEGER DEFAULT NULL;
ALTER TABLE tools ADD COLUMN rest_api INTEGER DEFAULT NULL;
ALTER TABLE tools ADD COLUMN fine_tuning INTEGER DEFAULT NULL;
ALTER TABLE tools ADD COLUMN quantization INTEGER DEFAULT NULL;
ALTER TABLE tools ADD COLUMN last_verified TEXT DEFAULT NULL;
```

### New D1 Tables

```sql
-- Site-wide content (nav, CTAs, hero, page meta)
CREATE TABLE site_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Marketing cards (featured, promoted, sponsors)
CREATE TABLE marketing_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,  -- 'featured' | 'promoted' | 'sponsor'
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

-- Filter dimension options
CREATE TABLE filter_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_key TEXT NOT NULL,  -- 'use_case', 'persona', 'license', etc.
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Category metadata (icons, descriptions, SEO)
CREATE TABLE category_meta (
  category_slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  og_image TEXT,
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Legal pages (markdown body)
CREATE TABLE legal_pages (
  slug TEXT PRIMARY KEY,  -- 'privacy', 'terms'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
```

---

## Phase 2 — Backfill Existing Tools

Script: `scripts/backfill-tools.ts`

Reads current heuristic output from `src/data/tools.json`, inserts extended field values into D1 `tools` table via API. Ensures existing tools are preserved with their current inferred values as explicit DB values.

---

## Phase 3 — Build Pipeline Extension

### New Scripts

| Script | Output | Source |
|--------|--------|--------|
| `scripts/build-site-content.ts` | `src/data/site-content.json` | D1 `site_content` table |
| `scripts/build-marketing.ts` | `src/data/marketing.json` | D1 `marketing_cards` table |
| `scripts/build-filter-options.ts` | `src/data/filter-options.json` | D1 `filter_options` table |
| `scripts/build-category-icons.ts` | `src/data/category-icons.json` | D1 `category_meta` table |
| `scripts/build-legal-pages.ts` | `src/data/legal-pages.json` | D1 `legal_pages` table |
| `scripts/backfill-tools.ts` | — | One-time migration |

### Updated Script

**`scripts/build-data.ts`**: Collapse `inferToolFields()` — each field becomes:
```ts
row.commercial_use ?? heuristic_fallback
```
No category-based heuristic duplication. Heuristics are documented inline as fallback logic.

### Pipeline Order

```
D1 Database
  ├── build-data.ts           → tools.json  (updated: 55+ fields)
  ├── build-categories.ts     → categories.json
  ├── build-site-content.ts   → site-content.json  (NEW)
  ├── build-marketing.ts      → marketing.json     (NEW)
  ├── build-filter-options.ts → filter-options.json (NEW)
  ├── build-category-icons.ts → category-icons.json (NEW)
  └── build-legal-pages.ts    → legal-pages.json   (NEW)
```

---

## Phase 4 — Heuristic Cleanup

### `build-data.ts::inferToolFields()`

Collapse to single-expression fallbacks:
```ts
function inferToolFields(row) {
  return {
    commercial_use: row.commercial_use ?? !/agpl|non-commercial|cc by-nc/i.test(row.license || ''),
    setup_difficulty: row.setup_difficulty ?? computeSetupDifficulty(row),
    use_cases: tryParseJson(row.use_cases) ?? computeUseCases(row),
    personas: tryParseJson(row.personas) ?? computePersonas(row),
    // ... all other fields follow same pattern
  };
}
```

### `src/utils/toolModel.ts::enrichTool()`

Simplify to pass-through with minimal fallbacks (defense in depth — should never fire if build pipeline is working):
```ts
export function enrichTool(tool: ToolWithCategory): ToolWithCategory {
  return {
    ...tool,
    plain_description: tool.plain_description || tool.body,
    technical_description: tool.technical_description || tool.body,
    setup_difficulty: tool.setup_difficulty || fallbackDifficulty(tool),
    // minimal fallbacks only
  };
}
```

### `filterConfig.ts`

Replace hardcoded options with import from `src/data/filter-options.json`:
```ts
import filterOptions from '../data/filter-options.json';
```

### `Card.vue` icon mapping

Replace switch statement with import from `src/data/category-icons.json`:
```ts
import iconMap from '../data/category-icons.json';
// iconMap: Record<string, string>  e.g. { "llm-inference": "brain", ... }
```

---

## Phase 5 — Admin Panel CRUD UIs

Add tabs to `AdminPanel.vue`:

| Tab | Table | Operations |
|-----|-------|-----------|
| **Tools** | `tools` | Existing approve/reject + edit extended fields |
| **Site Content** | `site_content` | Edit key-value pairs (nav, CTAs, hero) |
| **Marketing** | `marketing_cards` | Add/edit/reorder/activate featured, promoted, sponsors |
| **Filters** | `filter_options` | Add/edit/reorder filter dimension options |
| **Categories** | `category_meta` | Edit names, descriptions, icons, SEO |
| **Legal** | `legal_pages` | Edit privacy/terms markdown |

Each panel follows existing pattern: Vue component → POST to API route → writes to D1.

API routes (one per table):
- `/api/admin/content/[key].ts` — site_content CRUD
- `/api/admin/marketing/[id].ts` — marketing_cards CRUD
- `/api/admin/filters/[id].ts` — filter_options CRUD
- `/api/admin/categories/[slug].ts` — category_meta CRUD
- `/api/admin/legal/[slug].ts` — legal_pages CRUD

---

## Phase 6 — Component String Replacement

Replace hardcoded strings in components with imports from generated JSON data files:

| Component | Replaced by |
|-----------|------------|
| `Layout.astro` | `site-content.json` (nav labels, footer text) |
| `CardsContainer.vue` | `site-content.json` (sort button labels, empty state) |
| `HomeContainer.vue` | `site-content.json` (section headings) |
| `Sidebar.vue` | `marketing.json` (sponsor, newsletter, featured) |
| `FilterPanel.vue` | `filter-options.json` + `site-content.json` |
| `Card.vue` | `category-icons.json` (icon mapping) |
| `CompareView.vue` | `site-content.json` (table headers, labels) |
| `EmptyState.vue` | `site-content.json` (alt text) |
| `SearchInput.vue` | `site-content.json` (placeholder) |
| `privacy.astro` | `legal-pages.json` |
| `terms.astro` | `legal-pages.json` |

---

## Phase 7 — Remove Legacy Files

After migration is verified:

```
src/data/featured.json      → DELETE
src/data/promoted.json      → DELETE
src/data/sponsors.json      → DELETE
src/data/newsletter.json    → DELETE
```

---

## Migration Instructions

### Prerequisites

- Cloudflare API token with D1 write permissions
- Wrangler CLI installed (`npx wrangler`)
- Local `.env` file with `CLOUDFLARE_API_TOKEN`, `CF_ACCOUNT_ID`, `D1_DB_ID`

### Step 1: Apply Database Migrations

The migration files are in `wrangler/d1/migrations/`:

| File | Description |
|------|-------------|
| `001_tools.sql` | Create `tools` table (base columns) |
| `002_pending_tools.sql` | Create `pending_tools` table |
| `004_initial_data.sql` | Seed initial tool data |
| `005_private_ai_decision_fields.sql` | Add extended columns to `tools` |
| `006_categories.sql` | Create `categories` table + seed |
| `007_enforce_category_relation.sql` | Rebuild `tools` with FK + extended columns |
| `008_pending_tools_extended.sql` | **(NEW)** Add extended columns to `pending_tools` |
| `009_content_tables.sql` | **(NEW)** Create `site_content`, `marketing_cards`, `filter_options`, `category_meta`, `legal_pages` + seed defaults |

Apply ALL pending migrations (including new ones):

```bash
# Preview first (dry run)
npx wrangler d1 migrations apply enclavetools-db --remote

# Apply for real
npx wrangler d1 migrations apply enclavetools-db --remote
```

This applies all un-applied migrations in filename order (001 → 002 → 004 → 005 → 006 → 007 → 008 → 009). Migration 003 does not exist (was removed during development).

Verify:

```bash
npx wrangler d1 execute enclavetools-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

Expected tables: `categories`, `category_meta`, `filter_options`, `legal_pages`, `marketing_cards`, `pending_tools`, `site_content`, `tools`

### Step 2: Backfill Existing Tools

Seed the new extended columns (`commercial_use`, `setup_difficulty`, `use_cases`, `personas`, `openai_api`, etc.) with the current heuristic values so admin can later override them.

```bash
bun run scripts/backfill-tools.ts
```

This script reads the current heuristic output from `src/data/tools.json` and UPDATEs each tool's extended columns in D1 via the Cloudflare REST API.

### Step 3: Build and Deploy

The build pipeline now includes 5 new scripts that fetch from the new tables and fall back to defaults when D1 is unavailable.

```bash
# Build locally (will use defaults for new tables)
bun run build

# Verify pages render
bun run preview
```

After deploying to Cloudflare Pages, the pipeline will fetch all content from D1 tables.

### Step 4: (Future) Backfill New Content Tables

Once migrations are applied, the new tables contain default data from migration 009's seed INSERTs. To migrate existing manual content:

1. `site_content` — Already seeded with defaults from migration 009
2. `marketing_cards` — Already seeded with featured/promoted/sponsor defaults
3. `filter_options` — Already seeded with use_case/persona/license/etc. defaults
4. `category_meta` — Already seeded with icon names
5. `legal_pages` — Empty by default (privacy/terms content to be added via admin panel)

Or insert manually:

```bash
npx wrangler d1 execute enclavetools-db --remote --command="INSERT INTO site_content (key, value) VALUES ('nav_browse', 'Browse') ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value;"
```

### Troubleshooting

- **`D1 API Error: 400` on build scripts** — The new tables don't exist yet in D1. Apply migrations first, or ignore (scripts fall back to defaults).
- **`ALTER TABLE` fails** — Column may already exist. Check with `PRAGMA table_info(tools)` first.
- **Migration 003 not found** — Normal. It was removed during development and is simply skipped.

---

## Deploy Pattern

Edit content → Admin panel saves to D1 → Click "Rebuild site" button → POST to `/api/admin/rebuild.ts` → Cloudflare Pages deploy hook → Build pipeline regenerates all JSON → Static site deploys.

---

## Files to Create

| File | Purpose |
|------|---------|
| `scripts/build-site-content.ts` | Fetch site_content from D1, write JSON |
| `scripts/build-marketing.ts` | Fetch marketing_cards from D1, write JSON |
| `scripts/build-filter-options.ts` | Fetch filter_options from D1, write JSON |
| `scripts/build-category-icons.ts` | Fetch category_meta from D1, write JSON |
| `scripts/build-legal-pages.ts` | Fetch legal_pages from D1, write JSON |
| `scripts/backfill-tools.ts` | One-time migration of extended fields |
| `src/types/content.ts` | Type defs for new content types |
| `src/data/site-content.json` | Generated site content |
| `src/data/marketing.json` | Generated marketing cards |
| `src/data/filter-options.json` | Generated filter options |
| `src/data/category-icons.json` | Generated icon mapping |
| `src/data/legal-pages.json` | Generated legal pages |
| `src/data/schema.sql` | DDL for reference |

## Files to Modify

| File | Change |
|------|--------|
| `scripts/build-data.ts` | Collapse inferToolFields to NULL-safe fallbacks |
| `src/utils/toolModel.ts` | Simplify enrichTool to pass-through with minimal fallbacks |
| `src/composables/filterConfig.ts` | Import from filter-options.json instead of hardcoded arrays |
| `src/components/Card.vue` | Import icon map from category-icons.json |
| `src/components/CardsContainer.vue` | Import labels from site-content.json |
| `src/layouts/Layout.astro` | Import nav/footer from site-content.json |
| `src/components/Sidebar.vue` | Import from marketing.json |
| `src/components/EmptyState.vue` | Import labels from site-content.json |
| `src/components/HomeContainer.vue` | Import section headings from site-content.json |
| `src/pages/privacy.astro` | Import body from legal-pages.json |
| `src/pages/terms.astro` | Import body from legal-pages.json |
| `src/pages/admin.astro` | Add new admin panel routes |
| `src/components/AdminPanel.vue` | Add CRUD tabs for all content types |
| `src/lib/d1.ts` | Update Tool interface with all extended fields |

## Files to Delete

| File | Reason |
|------|--------|
| `src/data/featured.json` | Superseded by marketing.json |
| `src/data/promoted.json` | Superseded by marketing.json |
| `src/data/sponsors.json` | Superseded by marketing.json |
| `src/data/newsletter.json` | Superseded by site-content.json |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| D1 ALTER TABLE may fail on non-NULL columns | All new columns use DEFAULT NULL |
| Backfill script may timeout on large dataset | Batch updates in groups of 25 via D1 API |
| Heuristic behavior change after migration | Keep fallback logic identical; only NULL columns use fallbacks |
| Admin panel scope creep | Ship per-table CRUD incrementally; start with tools extended fields |
| Build time increases | Each script runs in <2s; parallelize with Promise.all |
