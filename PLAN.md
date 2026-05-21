# Enclavetools — Migration & Submission System Plan

## Context

**Goal**: Migrate from Supabase (PostgreSQL) to Cloudflare D1, add a public submission system with moderation, and drop Netlify deployment.

**Tech stack**: Astro 6 + Cloudflare Pages (SSR) → Astro 6 + Cloudflare Pages (static pre-rendering) + D1

**Important constraints**:
- Logos: 128x128 PNG, max 50KB, stored in `/public/favicons/` (served from CDN, no extra cost)
- Moderation queue: Just me (no login for publishers)
- Rebuild trigger: "Rebuild Now" button in admin panel (calls Cloudflare Pages API)
- GitHub auto-fetch: name, description, language, logo from GitHub if URL provided
- Logo upload fallback: publisher can upload PNG/JPG (resize to 128x128)

---

## Architecture

```
Publisher → /submit → pending_tools (D1)
                                    ↓
                              Admin (/admin)
                                    ↓
                        Approve → tools (D1)
                                    ↓
                    Build script → /public/favicons/ + src/data/tools.json
                                    ↓
                    Cloudflare Pages deploy → static site
```

---

## Database — D1 Schema

### `tools` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT (UUID) | Primary key |
| `name` | TEXT | |
| `slug` | TEXT | unique |
| `description` | TEXT | |
| `url` | TEXT | |
| `github_url` | TEXT | |
| `category` | TEXT | single value |
| `license` | TEXT | |
| `language` | TEXT | |
| `hardware` | TEXT | |
| `deployment` | TEXT | |
| `model_format` | TEXT | |
| `maturity` | TEXT | |
| `featured` | INTEGER | 0/1 |
| `popularity_score` | INTEGER | sort order |
| `date_added` | TEXT | ISO date |
| `last_updated` | TEXT | ISO date |
| `logo_source` | TEXT | `upload`/`github`/`google` |
| `created_at` | TEXT | ISO timestamp |

### `pending_tools` table
Same columns as `tools` +:
| Column | Type | Notes |
|--------|------|-------|
| `github_data` | TEXT | JSON — auto-fetched GitHub metadata |
| `status` | TEXT | `pending`/`approved`/`rejected` |
| `submitted_at` | TEXT | ISO timestamp |
| `reviewed_at` | TEXT | ISO timestamp |

---

## Submission Flow

**With GitHub URL**:
1. Publisher pastes GitHub URL → site fetches repo metadata via `https://api.github.com/repos/{owner}/{repo}`
2. Auto-fills: name, description, language, logo (GitHub avatar or repo root logo.png)
3. Publisher fills: category, hardware, maturity
4. Publisher optionally uploads custom logo (overrides GitHub logo)

**Without GitHub URL**:
- Publisher fills all fields manually: name, url, category, hardware, license, deployment, maturity, logo

**Submission**:
1. POST to `/api/submit`
2. Store in `pending_tools` with `status='pending'`
3. Show "Submitted! Pending review" (no email)

**Rate limit**: GitHub API 60 req/hour — sufficient for submit flow

---

## Admin Panel — `/admin`

- **Access**: Single password (env var `ADMIN_PASSWORD`)
- **Features**:
  - List pending submissions (newest first)
  - Show auto-fetched GitHub data + submitted fields + logo preview
  - **Approve**: move to `tools` table, trigger rebuild
  - **Reject**: set `status='rejected'`
  - **Rebuild Now**: POST to Cloudflare Pages Deployments API → triggers build

**Rebuild pipeline**:
1. Cloudflare clones GitHub repo
2. Runs `bun run scripts/build-data.ts`
3. Runs `bun run build`
4. Deploys to CDN

---

## Build Script — `scripts/build-data.ts`

Run at every Cloudflare Pages build:

1. Fetch approved tools from D1 (via wrangler CLI)
2. For each tool, download logo:
   - Priority 1: GitHub logo (from `github_data.avatar_url`)
   - Priority 2: Google Favicon fallback (`https://www.google.com/s2/favicons?sz=128&domain={domain}`)
3. Resize to 128x128, max 50KB (convert to WebP if smaller), save to `/public/favicons/{slug}.png`
4. Write `tools.json` to `src/data/`

---

## Pages — Pre-rendering

| Route | Data | Pre-render |
|-------|------|-----------|
| `/` | All tools (sorted by popularity) | Yes |
| `/[category]` | Category-filtered | Yes (all 19 categories) |
| `/tools/[slug]` | Individual tool | Yes (all slugs) |
| `/submit` | Form only | Yes |
| `/admin` | Dynamic (password check) | No (SSR) |
| `/api/*` | API endpoints | No |

---

## Files to Create

| File | Purpose |
|------|---------|
| `wrangler/d1/migrations/001_tools.sql` | `tools` table schema |
| `wrangler/d1/migrations/002_pending_tools.sql` | `pending_tools` table schema |
| `src/lib/d1.ts` | D1 client wrapper |
| `src/lib/github.ts` | GitHub API fetch utility |
| `src/pages/api/submit.ts` | Submit endpoint |
| `src/pages/submit.astro` | Submission form page |
| `src/pages/admin.astro` | Admin moderation panel (SSR) |
| `src/pages/api/admin/approve/[id].ts` | Approve action |
| `src/pages/api/admin/reject/[id].ts` | Reject action |
| `src/pages/api/admin/rebuild.ts` | Rebuild trigger |
| `src/components/SubmitForm.vue` | Form component |
| `src/components/AdminPanel.vue` | Admin dashboard component |
| `src/components/LogoUpload.vue` | Logo upload component |
| `scripts/build-data.ts` | Build-time data + logo fetcher |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/index.astro` | Use `tools.json`, `prerender = true` |
| `src/pages/[category].astro` | Use `tools.json`, pre-render all categories |
| `src/pages/tools/[slug].astro` | Use `tools.json`, pre-render all slugs |
| `src/lib/supabase.ts` | Delete |
| `netlify.toml` | Delete |
| `.env` | Remove Supabase vars, add D1 + admin password |
| `wrangler.jsonc` | Add D1 binding |
| `astro.config.mjs` | Update as needed |

## Dependencies to Remove

- `@supabase/supabase-js`

---

## Migration Steps

| Phase | Tasks |
|-------|-------|
| **1. Setup** | Create D1 database, apply migrations, add D1 binding to wrangler.jsonc, remove Supabase client |
| **2. Static data** | Create build-data.ts, update pages to use tools.json, switch to prerender=true |
| **3. Submission** | GitHub fetch utility, /submit page, /api/submit endpoint |
| **4. Admin** | /admin panel, approve/reject/rebuild API endpoints |
| **5. Data migration** | Export from Supabase, import into D1 |
| **6. Deploy** | Remove Netlify, push to GitHub, verify Cloudflare Pages build |

---

## Open Decisions

1. **Slug generation**: Auto-generate from name, or let publisher choose?
2. **Tool editing**: Can publishers edit their tool after approval? (or just you via admin?)
3. **Pending queue public**: Should publishers see their submission status?
