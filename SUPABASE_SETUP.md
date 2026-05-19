# Supabase Setup Guide

## 1. Link Your Project

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your existing project
supabase link --project-ref <your-project-ref>
```

Find your project ref in the Supabase dashboard URL: `https://supabase.com/dashboard/project/<ref>`

## 2. Apply Migrations

```bash
supabase db push
```

This applies both migrations:
- `001_initial_schema.sql` — creates the `tools` table, indexes, and RLS policy
- `002_filter_functions.sql` — creates `get_filtered_tools()` and `count_filtered_tools()` RPC functions

## 3. Verify

Run in the Supabase SQL Editor or via CLI:

```sql
-- Check table exists
SELECT count(*) FROM tools;

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'tools';

-- Check RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'tools';

-- Test RPC function (should return empty set until data is migrated)
SELECT * FROM get_filtered_tools();
SELECT count_filtered_tools();
```

## 4. Environment Variables

Create `.env` in the project root:

```
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<publishable_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

Get these from **Settings → API** in the Supabase dashboard.

| Variable | Used by | Purpose |
|---|---|---|
| `SUPABASE_ANON_KEY` | Astro SSR + API endpoints | Read-only access to Supabase (respects RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Migration script only | Write access for data import (bypasses RLS) |

For Cloudflare Pages deployment, add the `SUPABASE_URL` and `SUPABASE_ANON_KEY` as environment variables. The `SUPABASE_SERVICE_ROLE_KEY` is only needed locally for the one-time migration.

## 5. Migrate Data

```bash
# Set env vars first
export SUPABASE_URL=https://<your-project-ref>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<key>

# Run migration script
npx tsx scripts/migrate-to-supabase.ts
```

This reads `src/data/tools.json` and inserts all tools into Supabase.

## 6. Data API Settings

Ensure the `tools` table is accessible via the REST API:

1. Go to **Settings → Data API** in the Supabase dashboard
2. Verify that `anon` and `authenticated` roles have SELECT access
3. The RLS policy `public read` already allows anyone to read rows

## 7. Security Notes

- The `anon` key is used for all server-side reads — it respects RLS policies
- The `service_role` key is only used in the migration script for writes
- The `tools` table has RLS enabled with a public read policy
- No write policies exist — only server-side inserts via `service_role`
- The RPC functions are `stable` (read-only) and safe to call from any role
- **Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code or public repos**
