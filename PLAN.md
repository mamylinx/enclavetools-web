# Enclavetools — Migration & Submission System Plan (v3)

## Context

**Goal**: Use Cloudflare D1 as storage for tools data and add a public submission system with moderation.

**Tech stack**: Astro 6 + Cloudflare Pages (static pre-rendering) + D1 + R2

**Important constraints**:
- Logos: 128x128 PNG, max 50KB, stored in `/public/favicons/` (served from CDN, no extra cost)
- Moderation queue: Single admin (no login for publishers)
- Rebuild trigger: "Rebuild Now" button in admin panel (calls Cloudflare Pages API)
- GitHub auto-fetch: name, description, language, logo, license, stargazers from GitHub if URL provided
- Logo upload fallback: publisher can upload PNG/JPG (resize to 128x128)
- **Security**: Admin panel protected by password + CSRF protection, API endpoints rate-limited, all inputs validated/sanitized

---

## Architecture

```
Publisher → /submit → pending_tools (D1) + logo (R2)
                                            ↓
                                      Admin (/admin)
                                            ↓
                                  Approve → tools (D1)
                                            ↓
                          Build script → /public/favicons/ + src/data/tools.json
                                            ↓
                          Cloudflare Pages deploy → static site (CDN)
```

**Key change**: `output: 'static'` in `astro.config.mjs` — Astro 6.3+ `static` mode now handles SSR routes (API endpoints, admin page) the same way `hybrid` did previously.

---

## Database — D1 Schema

### `tools` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT (UUID) | Primary key |
| `name` | TEXT | Maps to existing `title` |
| `slug` | TEXT | UNIQUE |
| `description` | TEXT | Maps to existing `body` |
| `url` | TEXT | |
| `github_url` | TEXT | |
| `category` | TEXT | Single value |
| `license` | TEXT | |
| `language` | TEXT | JSON array: `["Python","Go"]` |
| `hardware` | TEXT | JSON array: `["CPU Only","NVIDIA GPU"]` |
| `deployment` | TEXT | JSON array: `["Docker","Bare Metal"]` |
| `model_format` | TEXT | JSON array: `["GGUF","Safetensors"]` |
| `maturity` | TEXT | |
| `featured` | INTEGER | 0/1 |
| `popularity_score` | INTEGER | GitHub stars count, used for sorting |
| `date_added` | TEXT | ISO date |
| `last_updated` | TEXT | ISO date |
| `logo_source` | TEXT | `upload`/`github`/`google` |
| `created_at` | TEXT | ISO timestamp |

### `pending_tools` table
Same columns as `tools` +:
| Column | Type | Notes |
|--------|------|-------|
| `github_data` | TEXT | JSON — auto-fetched GitHub metadata |
| `logo_r2_key` | TEXT | R2 object key for uploaded logo |
| `status` | TEXT | `pending`/`approved`/`rejected` |
| `submitted_at` | TEXT | ISO timestamp |
| `reviewed_at` | TEXT | ISO timestamp |

### `admin_login_attempts` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT (UUID) | Primary key |
| `ip_hash` | TEXT | SHA-256 hash of IP |
| `attempted_at` | TEXT | ISO timestamp |
| `success` | INTEGER | 0/1 |

---

## Storage — R2 Bucket

**Bucket name**: `enclavetools-logos`

**Usage**:
- Uploaded logos during submission → `pending/{uuid}.{ext}`
- Admin approval copies to `approved/{slug}.png`
- Build script downloads from `approved/` → resizes → writes to `/public/favicons/{slug}.png`

**Wrangler binding**:
```jsonc
"r2_buckets": [
  { "binding": "LOGOS", "bucket_name": "enclavetools-logos" }
]
```

---

## Security Model

### Admin Authentication
- Single password from env var `ADMIN_PASSWORD` (stored as Cloudflare Pages secret)
- Session-based auth using signed HTTP-only cookies
- Cookie signed with `ADMIN_SECRET` (separate env var, used for HMAC)
- Session TTL: 24 hours
- Brute-force protection: max 5 failed attempts per IP per hour (tracked in D1 `admin_login_attempts` table)

### API Security
- All `/api/admin/*` endpoints require valid admin session cookie
- CSRF token required for all POST/PUT/DELETE to admin endpoints
- Rate limiting: 10 requests/minute per IP on `/api/submit`, 30/minute on `/api/admin/*`
- Input validation: Zod schemas on all API endpoints
- Content Security Policy headers on admin pages

### Data Validation
- All user inputs validated with Zod before D1 insertion
- URL fields validated as proper URLs
- File uploads: PNG/JPG only, max 50KB after resize, validated MIME type
- Slug generation: lowercase, alphanumeric + hyphens, unique constraint enforced

---

## Submission Flow

**With GitHub URL**:
1. Publisher pastes GitHub URL → client-side fetches repo metadata via `https://api.github.com/repos/{owner}/{repo}`
2. Auto-fills: name, description, language, logo URL (GitHub avatar), license, `popularity_score` (stargazers_count)
3. Publisher fills: category (single select), hardware, maturity
4. Publisher optionally uploads custom logo (overrides GitHub logo)

**Without GitHub URL**:
- Publisher fills all fields manually

**Submission**:
1. POST to `/api/submit` with validated form data
2. If logo uploaded → store in R2 (`pending/{uuid}.png`), store key in `logo_r2_key`
3. Store in `pending_tools` with `status='pending'`
4. Show "Submitted! Pending review" (no email)

**Rate limit**: GitHub API 60 req/hour unauthenticated — mitigated by client-side fetch (browser origin). For server-side validation, use `GITHUB_TOKEN` env var (5,000 req/hour).

---

## Admin Panel — `/admin` (SSR)

- **Access**: Password login → session cookie
- **Features**:
  - Login form with CSRF token
  - List pending submissions (newest first)
  - Show auto-fetched GitHub data + submitted fields + logo preview
  - **Approve**: move to `tools` table, copy logo from R2 `pending/` → `approved/`, trigger rebuild
  - **Reject**: set `status='rejected'`, delete R2 logo
  - **Rebuild Now**: POST to Cloudflare Pages Deployments API

**Rebuild trigger API**:
- `POST https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/pages/projects/{PROJECT_NAME}/deployments`
- Requires `CLOUDFLARE_API_TOKEN` with `Cloudflare Pages:Edit` permission
- Token stored as Pages environment variable (encrypted)

---

## Build Script — `scripts/build-data.ts`

Run at every Cloudflare Pages build:

1. Fetch approved tools from D1 via Cloudflare REST API:
   - `POST https://api.cloudflare.com/client/v4/accounts/{accountId}/d1/database/{databaseId}/query`
   - Requires `CLOUDFLARE_API_TOKEN` with `D1:Read`
   - Token from Pages env var — no wrangler CLI needed in build container
2. For each tool, download logo:
   - Priority 1: R2 approved logo (`approved/{slug}.png`)
   - Priority 2: GitHub avatar (from `github_data.avatar_url`)
   - Priority 3: Google Favicon fallback (`https://www.google.com/s2/favicons?sz=128&domain={domain}`)
3. Resize to 128x128, max 50KB, save to `/public/favicons/{slug}.png`
4. Write `tools.json` to `src/data/` in existing format (category-grouped) for frontend compatibility
5. Write `slug-map.json` to `src/data/`

**Why REST API over wrangler CLI**: Cloudflare Pages build runs in an isolated container without wrangler auth. The REST API with a scoped API token is the only reliable way to query D1 during build.

---

## Pages — Pre-rendering

| Route | Data | Rendering |
|-------|------|-----------|
| `/` | All tools (from `tools.json`) | Static (`getStaticPaths`) |
| `/[category]` | Category-filtered | Static (`getStaticPaths` — all 19 categories) |
| `/tools/[slug]` | Individual tool | Static (`getStaticPaths` — all slugs) |
| `/submit` | Form only | Static |
| `/saved` | Client-side bookmarks | Static |
| `/admin` | Dynamic (session check) | SSR |
| `/api/*` | API endpoints | SSR (edge functions) |

---

## Files to Create

| File | Purpose |
|------|---------|
| `wrangler/d1/migrations/001_tools.sql` | `tools` table schema |
| `wrangler/d1/migrations/002_pending_tools.sql` | `pending_tools` table schema |
| `wrangler/d1/migrations/003_admin_login_attempts.sql` | Brute-force protection table |
| `src/lib/d1.ts` | D1 client wrapper (for SSR routes) |
| `src/lib/r2.ts` | R2 client wrapper (for SSR routes) |
| `src/lib/github.ts` | GitHub API fetch utility (with token support) |
| `src/lib/auth.ts` | Session management, password hashing, CSRF |
| `src/lib/validation.ts` | Zod schemas for all inputs |
| `src/lib/rate-limit.ts` | IP-based rate limiting (D1-backed) |
| `src/pages/submit.astro` | Submission form page (static) |
| `src/pages/admin.astro` | Admin login + moderation panel (SSR) |
| `src/pages/api/submit.ts` | Submit endpoint |
| `src/pages/api/admin/login.ts` | Admin login endpoint |
| `src/pages/api/admin/logout.ts` | Admin logout endpoint |
| `src/pages/api/admin/tools/[id]/approve.ts` | Approve action |
| `src/pages/api/admin/tools/[id]/reject.ts` | Reject action |
| `src/pages/api/admin/rebuild.ts` | Rebuild trigger |
| `src/pages/api/github/fetch.ts` | GitHub data fetch endpoint |
| `src/components/SubmitForm.vue` | Form component with GitHub autofill |
| `src/components/AdminPanel.vue` | Admin dashboard component |
| `src/components/LoginForm.vue` | Admin login form |
| `src/components/LogoUpload.vue` | Logo upload + preview component |
| `scripts/build-data.ts` | Build-time data + logo fetcher (REST API) |

## Files to Modify

| File | Change |
|------|--------|
| `astro.config.mjs` | Keep `output: 'static'` (Astro 6.3+ handles SSR automatically) |
| `wrangler.jsonc` | Add D1 binding, R2 binding, `nodejs_compat` flag |
| `.gitignore` | Add `.dev.vars` |
| `src/layouts/Layout.astro` | Update "Submit" nav link to `/submit` |
| `package.json` | Add `zod`, `sharp` dependencies |

## Dependencies to Add

| Package | Purpose |
|---------|---------|
| `zod` | Input validation schemas |
| `sharp` | Image resize/compression in build script |
| `@cloudflare/workers-types` | D1/R2 type definitions |

---

## Migration Steps

| Phase | Tasks |
|-------|-------|
| **1. Setup** | Create D1 database, create R2 bucket (via Cloudflare Dashboard), apply migrations, add bindings to `wrangler.jsonc`, set env vars (Pages secrets) |
| **2. Data migration** | Create `build-data.ts`, migrate existing `tools.json` into D1 `tools` table, download existing favicons to R2 `approved/` |
| **3. Submission** | GitHub fetch utility, Zod validation schemas, `/submit` page, `/api/submit` endpoint with rate limiting, R2 logo upload |
| **4. Admin auth** | Session management, CSRF tokens, brute-force protection, `/admin` login page, `/api/admin/login`, `/api/admin/logout` |
| **5. Admin moderation** | Pending tools list, approve/reject endpoints, logo preview, R2 copy/delete on status change |
| **6. Rebuild** | Rebuild trigger endpoint, Cloudflare Pages API integration, `CLOUDFLARE_API_TOKEN` setup |
| **7. Deploy & verify** | Verify Cloudflare Pages build succeeds, test full submission→approve→rebuild→publish flow, security audit |

---

## Environment Variables (Pages Secrets)

| Variable | Purpose | Required |
|----------|---------|----------|
| `ADMIN_PASSWORD` | Admin panel password (bcrypt hashed at runtime) | Yes |
| `ADMIN_SECRET` | Session signing key (random 32+ bytes) | Yes |
| `CLOUDFLARE_API_TOKEN` | API token for D1 read + Pages deploy | Yes |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Yes |
| `GITHUB_TOKEN` | GitHub API token (5,000 req/hour) | No (fallback to 60/hr) |

**Local dev** (`.dev.vars`):
```
ADMIN_PASSWORD=dev-password
ADMIN_SECRET=dev-secret-key-at-least-32-bytes-long
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

---

## API Token Permissions

`CLOUDFLARE_API_TOKEN` needs:
- `Account.Account Settings: Read`
- `D1: Read` (for build script)
- `Cloudflare Pages: Edit` (for rebuild trigger)

Create via Cloudflare Dashboard → My Profile → API Tokens → Create Token → Custom.

---

## D1 Migration SQL

**`001_tools.sql`**:
```sql
CREATE TABLE IF NOT EXISTS tools (
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
  created_at TEXT
);
```

**`002_pending_tools.sql`**:
```sql
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
  github_data TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TEXT,
  reviewed_at TEXT
);
```

**`003_admin_login_attempts.sql`**:
```sql
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  attempted_at TEXT NOT NULL,
  success INTEGER DEFAULT 0
);
```

---

## Key Differences from v1 Plan

1. **`output: 'static'`** — Astro 6.3+ handles SSR routes automatically; `hybrid` mode no longer exists
2. **R2 bucket** for logo storage — no filesystem access in Pages build
3. **D1 via REST API** in build script — wrangler CLI unavailable in build container
4. **Array fields stored as JSON TEXT** — matches existing frontend expectations
5. **`popularity_score`** — single field (was `github_stars` in v1, consolidated)
6. **Security layer**: session auth, CSRF, rate limiting, input validation, brute-force protection
7. **`nodejs_compat`** compatibility flag — needed for `sharp` and Node.js APIs in SSR
8. **Phase 5** restored (was typo in v1)
