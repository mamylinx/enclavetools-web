/**
 * Admin script: inserts a tool into the D1 `tools` table from a JSON file.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... CF_ACCOUNT_ID=... D1_DB_ID=... \
 *     bun run scripts/upload-tool.ts ./path/to/tool.json
 *
 * JSON format (all D1Tool fields):
 * {
 *   "name": "My Tool",           // required
 *   "description": "Does X",     // required
 *   "url": "https://example.com", // required
 *   "category": "llm-inference",  // required
 *   "slug": "my-tool",           // optional – auto-generated from name if omitted
 *   "github_url": "https://github.com/...",
 *   "license": "MIT",
 *   "language": "[\"Go\"]",
 *   "hardware": "[\"CPU Only\"]",
 *   "deployment": "[\"Docker\"]",
 *   "model_format": "[\"GGUF\"]",
 *   "maturity": "stable",
 *   "popularity_score": 1000,
 *   "plain_description": "...",
 *   "technical_description": "...",
 *   "setup_difficulty": "easy",
 *   "commercial_use": 1,
 *   "telemetry": "None",
 *   "offline_after_setup": 1,
 *   "paid_support": 0,
 *   "gui_available": 1,
 *   "docker_available": 1,
 *   "openai_api": 0,
 *   "rest_api": 1,
 *   "fine_tuning": 0,
 *   "quantization": 0,
 *   "docs_url": "https://docs.example.com",
 *   "use_cases": "[\"chat\",\"code_generation\"]",
 *   "personas": "[\"developer\"]",
 *   "min_ram_gb": 8,
 *   "recommended_ram_gb": 16,
 *   "community_notes_count": 0,
 *   "community_guides_count": 0,
 *   "last_verified": null
 * }
 */

import fs from 'fs';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DB_ID = process.env.D1_DB_ID;

const REQUIRED_FIELDS = ['name', 'description', 'url', 'category'] as const;

interface ToolInput {
  name: string;
  description: string;
  url: string;
  category: string;
  slug?: string;
  [key: string]: unknown;
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DB_ID) {
    console.error("❌ Missing Cloudflare credentials. Set CLOUDFLARE_API_TOKEN, CF_ACCOUNT_ID, D1_DB_ID.");
    process.exit(1);
  }

  const filePath = process.argv[2];
  if (!filePath) {
    console.error("❌ Missing JSON file path. Usage: bun run scripts/upload-tool.ts ./tool.json");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  let tool: ToolInput;
  try {
    tool = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed to parse JSON: ${e}`);
    process.exit(1);
  }

  for (const field of REQUIRED_FIELDS) {
    if (!tool[field]) {
      console.error(`❌ Missing required field: "${field}"`);
      process.exit(1);
    }
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const slug = tool.slug || generateSlug(tool.name);
  const today = now.split('T')[0];

  const sql = `INSERT INTO tools (
    id, name, slug, description, url, github_url, category, license,
    language, hardware, deployment, model_format, maturity, featured,
    popularity_score, date_added, last_updated, logo_source, created_at,
    plain_description, technical_description, commercial_use, setup_difficulty,
    use_cases, personas, features, works_with, docs_url,
    community_guides, community_notes, min_ram_gb, recommended_ram_gb,
    telemetry, offline_after_setup, paid_support, gui_available,
    docker_available, openai_api, rest_api, fine_tuning, quantization,
    community_notes_count, community_guides_count, last_verified
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'google', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`;

  const params = [
    id, tool.name, slug, tool.description, tool.url,
    tool.github_url || null, tool.category, tool.license || null,
    tool.language || null, tool.hardware || null, tool.deployment || null,
    tool.model_format || null, tool.maturity || null,
    tool.popularity_score || 0, today, today, now,
    tool.plain_description || null, tool.technical_description || null,
    tool.commercial_use ?? null, tool.setup_difficulty || null,
    tool.use_cases || null, tool.personas || null,
    tool.features || null, tool.works_with || null, tool.docs_url || null,
    tool.community_guides || null, tool.community_notes || null,
    tool.min_ram_gb ?? null, tool.recommended_ram_gb ?? null,
    tool.telemetry || null, tool.offline_after_setup ?? null,
    tool.paid_support ?? null, tool.gui_available ?? null,
    tool.docker_available ?? null, tool.openai_api ?? null,
    tool.rest_api ?? null, tool.fine_tuning ?? null,
    tool.quantization ?? null,
    tool.last_verified || null,
  ];

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ Failed to insert tool: ${err}`);
    process.exit(1);
  }

  console.log(`✅ Tool "${tool.name}" (${slug}) inserted successfully.`);
  console.log(`   ID: ${id}`);
  console.log(`   Now run: wrangler d1 migrations apply enclavetools-db --remote && bun run prepare-data`);
}

main().catch(console.error);
