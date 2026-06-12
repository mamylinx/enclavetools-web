# Enclavetools

A curated directory of AI tools that run on your own hardware. No API fees. No vendor lock-in.

## Tech Stack

- **Framework**: Astro 6 with Vue 3 components
- **Hosting**: Cloudflare Pages (static pre-rendering + SSR for admin/API)
- **Database**: Cloudflare D1 (serverless SQLite)
- **Styling**: Tailwind CSS 4 with CSS custom properties

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

### Pre-rendered pages
All public pages (`/`, `/[category]`, `/tools/[slug]`, `/submit`) are pre-rendered as static HTML at build time.

### SSR pages
`/admin` and `/api/*` run at request time — only these require D1 binding and secrets.

### Client-side
Tool filtering, search, and bookmarks run entirely in the browser from the pre-loaded tools data.

## Prerequisites

1. **Node.js 18+** and npm
2. **Cloudflare account** with D1 and Pages access
3. **GitHub repository** connected to Cloudflare Pages
4. **Cloudflare API token** with D1 and Pages read/write permissions

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-repo/enclavetools.git
cd enclavetools
npm install
```

### 2. Create D1 Database

```bash
npx wrangler d1 create enclavetools --location wnam
```

This auto-updates `wrangler.jsonc` with the binding.

### 3. Apply Migrations

```bash
# Local (development)
npx wrangler d1 migrations apply enclavetools --local

# Remote (production)
npx wrangler d1 migrations apply enclavetools --remote
```

Two tables are created:
- `tools` — approved/published tools
- `pending_tools` — submitted tools awaiting review

### 4. Set Secrets

```bash
# Cloudflare credentials (for rebuild feature)
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put CF_API_TOKEN
```

For local development, add these to `.dev.vars`:

```
CF_ACCOUNT_ID=dev-account-id
CF_API_TOKEN=dev-api-token
```

### 5. Generate Tools Data

```bash
# Pull approved tools from D1 and write src/data/tools.ts
npx tsx scripts/build-data.ts
```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:4321`.

## Build & Deploy

### Cloudflare Pages (recommended)

Connect your GitHub repo to Cloudflare Pages. Set the build command:

```bash
npm run build
```

Output directory: `dist`

Cloudflare Pages automatically runs the build, which pulls D1 data and pre-renders all pages.

### Manual Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name enclavetools
```

## Admin Panel

Access at `/admin` (secured by Cloudflare Access).

**Approve**: moves submission from `pending_tools` → `tools`, triggers rebuild
**Reject**: marks submission as `status='rejected'`
**Rebuild Now**: calls Cloudflare Pages Deployments API to re-run the build

## Submission Flow

1. Publisher visits `/submit`
2. Optionally pastes GitHub URL → auto-fills name, description, language, logo
3. Fills classification fields (category, maturity, license, hardware, etc.)
4. Submits → stored in `pending_tools` with `status='pending'`
5. Admin approves → moved to `tools`, rebuild triggered
6. Build script runs → `tools.ts` regenerated, logos downloaded, pages pre-rendered

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run build:data` | Run build-data.ts only |
| `npx wrangler d1 migrations apply enclavetools-db --local` | Apply local migrations |
| `npx wrangler d1 migrations apply enclavetools-db --remote` | Apply remote migrations |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CF_ACCOUNT_ID` | For rebuild | Cloudflare account ID |
| `CF_API_TOKEN` | For rebuild | Cloudflare API token |
| `CF_PAGES_PROJECT` | No | Pages project name (default: `enclavetools`) |

## Project Structure

```
enclavetools/
├── src/
│   ├── components/
│   │   ├── SubmitForm.vue       # Submission form with GitHub auto-fill
│   │   └── AdminPanel.vue       # Admin moderation dashboard
│   ├── data/
│   │   └── tools.ts             # Generated at build time (not committed)
│   ├── lib/
│   │   ├── d1.ts                # D1 client types
│   │   └── github.ts            # GitHub API fetch utility
│   ├── pages/
│   │   ├── api/
│   │   │   ├── submit.ts         # POST: submit a tool
│   │   │   └── admin/
│   │   │       ├── list.ts      # GET: pending submissions
│   │   │       ├── approve/[id].ts  # POST: approve + rebuild
│   │   │       ├── reject/[id].ts    # POST: reject
│   │   │       └── rebuild.ts   # POST: trigger Pages deploy
│   │   ├── admin.astro           # SSR admin panel
│   │   ├── submit.astro          # Static submission page
│   │   ├── index.astro           # Home (static, pre-rendered)
│   │   ├── [category].astro      # Category pages (static, pre-rendered)
│   │   └── tools/[slug].astro   # Tool detail (static, pre-rendered)
│   ├── layouts/Layout.astro     # Base layout
│   └── styles/main.css           # Tailwind + design system
├── wrangler/d1/migrations/
│   ├── 001_tools.sql            # tools table schema
│   └── 002_pending_tools.sql     # pending_tools table schema
├── scripts/
│   └── build-data.ts             # Build-time: D1 → tools.ts + logos
├── wrangler.jsonc                # D1 binding, observability
├── astro.config.mjs              # Cloudflare adapter, Vue, Tailwind
└── package.json
```

## Troubleshooting

**Build fails with `getStaticPathsRequired`**

Ensure `export const prerender = true` is set on all static pages. This is already configured in the project.

**D1 query fails**

- For local: use `--local` flag with `wrangler d1 execute`
- For remote: verify `database_id` is set in `wrangler.jsonc`
- Check Cloudflare Access is configured for `/admin` and `/api/admin/*`

**GitHub auto-fill not working**

GitHub API rate limit is 60 requests/hour for unauthenticated requests. This is sufficient for the submit flow.

**Logo not showing**

Logos are downloaded at build time by `build-data.ts`. If `/public/favicons/{slug}.png` doesn't exist, the tool detail page shows a fallback icon.

## License

MIT
