import fs from 'fs';
import path from 'path';

/**
 * One-time backfill script: reads the current tools.json (which has
 * heuristically inferred extended fields) and writes them back into
 * the D1 database so the extended columns are populated with values
 * that admins can later override.
 *
 * Usage: CLOUDFLARE_API_TOKEN=... CF_ACCOUNT_ID=... D1_DB_ID=... bun run scripts/backfill-tools.ts
 */

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DB_ID = process.env.D1_DB_ID;

const dataDir = path.join(process.cwd(), 'src/data');
const toolsJsonPath = path.join(dataDir, 'tools.json');

async function main() {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DB_ID) {
    console.error("❌ Missing Cloudflare credentials. Set CLOUDFLARE_API_TOKEN, CF_ACCOUNT_ID, D1_DB_ID.");
    process.exit(1);
  }

  if (!fs.existsSync(toolsJsonPath)) {
    console.error("❌ tools.json not found. Run 'bun run prepare-data' first.");
    process.exit(1);
  }

  const { tools } = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf-8'));
  const allTools: any[] = tools.flatMap((cat: any) => cat.content);
  console.log(`📦 Found ${allTools.length} tools to backfill`);

  const BATCH_SIZE = 25;
  let updated = 0;

  for (let i = 0; i < allTools.length; i += BATCH_SIZE) {
    const batch = allTools.slice(i, i + BATCH_SIZE);
    const statements = batch.map((t: any) => ({
      sql: `UPDATE tools SET
        body = ?,
        plain_description = ?,
        technical_description = ?,
        commercial_use = ?,
        setup_difficulty = ?,
        use_cases = ?,
        personas = ?,
        features = ?,
        works_with = ?,
        docs_url = ?,
        community_guides = ?,
        community_notes = ?,
        min_ram_gb = ?,
        recommended_ram_gb = ?,
        telemetry = ?,
        offline_after_setup = ?,
        paid_support = ?,
        gui_available = ?,
        docker_available = ?,
        openai_api = ?,
        rest_api = ?,
        fine_tuning = ?,
        quantization = ?,
        community_notes_count = ?,
        community_guides_count = ?,
        last_verified = ?
        WHERE slug = ?`,
      params: [
        t.body ?? null,
        t.plain_description ?? null,
        t.technical_description ?? null,
        t.commercial_use == null ? null : t.commercial_use ? 1 : 0,
        t.setup_difficulty ?? null,
        JSON.stringify(t.use_cases ?? []),
        JSON.stringify(t.personas ?? []),
        JSON.stringify(t.features ?? []),
        JSON.stringify(t.works_with ?? []),
        t.docs_url ?? null,
        JSON.stringify(t.community_guides ?? []),
        JSON.stringify(t.community_notes ?? []),
        t.min_ram_gb ?? null,
        t.recommended_ram_gb ?? null,
        t.telemetry ?? null,
        t.offline_after_setup == null ? null : t.offline_after_setup ? 1 : 0,
        t.paid_support == null ? null : t.paid_support ? 1 : 0,
        t.gui_available == null ? null : t.gui_available ? 1 : 0,
        t.docker_available == null ? null : t.docker_available ? 1 : 0,
        t.openai_api == null ? null : t.openai_api ? 1 : 0,
        t.rest_api == null ? null : t.rest_api ? 1 : 0,
        t.fine_tuning == null ? null : t.fine_tuning ? 1 : 0,
        t.quantization == null ? null : t.quantization ? 1 : 0,
        t.community_notes_count ?? 0,
        t.community_guides_count ?? 0,
        t.last_verified ?? null,
        t.slug,
      ],
    }));

    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: statements.map((s) => s.sql).join(';'), params: statements.flatMap((s) => s.params) }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed: ${err}`);
      continue;
    }

    updated += batch.length;
    console.log(`✅ Batch ${i / BATCH_SIZE + 1}: ${batch.length} tools updated (${updated}/${allTools.length})`);
  }

  console.log(`\n🎉 Backfill complete. ${updated}/${allTools.length} tools updated.`);
  console.log("Now run: wrangler d1 migrations apply enclavetools-db --remote");
}

main().catch(console.error);
