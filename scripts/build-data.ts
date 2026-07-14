import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

const GH_TOKEN = process.env.GITHUB_TOKEN;
const HF_TOKEN = process.env.HF_TOKEN;

if (!GH_TOKEN) {
  console.warn('⚠️  GITHUB_TOKEN not set — GitHub calls limited to 60/hr; missing ones fall back to seed-only records.');
}

type Seed = {
  source: 'github' | 'huggingface' | 'url';
  id: string;
  category: string;
  title: string;
  slug: string;
  url: string | null;
  github_url: string | null;
  license?: string | null;
};

// ---------- API fetchers ----------

async function githubFacts(fullName: string): Promise<any | null> {
  const url = `https://api.github.com/repos/${fullName}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'enclavetools-builder',
  };
  if (GH_TOKEN) headers.Authorization = `Bearer ${GH_TOKEN}`;
  const res = await fetch(url, { headers });
  if (res.status === 403 || res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${fullName}`);
  return res.json();
}

async function hfFacts(modelId: string): Promise<any | null> {
  const url = `https://huggingface.co/api/models/${modelId}`;
  const headers: Record<string, string> = { 'User-Agent': 'enclavetools-builder' };
  if (HF_TOKEN) headers.Authorization = `Bearer ${HF_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return res.json();
}

// ---------- derivations ----------

function deriveCommercialUse(license: string | null | undefined): number | null {
  if (!license) return null;
  const l = license.toLowerCase();
  if (l.includes('non-commercial') || l.includes('nc') && l.includes('cc')) return 0;
  if (l.includes('nc')) return 0;
  const open = /(mit|apache|bsd|isc|mpl|mpl-|gpl|lgpl|agpl|unlicense|cc0|cc-by|wtfpl|zlib|ms-pl)/;
  if (open.test(l)) return 1;
  return null;
}

function deriveTag(license: string | null | undefined): string {
  if (!license || license === 'NOASSERTION') return 'Free';
  return license;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildTool(seed: Seed, facts: any | null): any {
  const isGh = seed.source === 'github' && facts;
  const isHf = seed.source === 'huggingface' && facts;

  const description =
    (isGh && facts.description) ||
    (isHf && (facts.cardData?.description || facts.description)) ||
    '';

  const license = isGh
    ? facts.license?.spdx_id && facts.license.spdx_id !== 'NOASSERTION'
      ? facts.license.spdx_id
      : seed.license ?? null
    : isHf
    ? Array.isArray(facts.license)
      ? facts.license[0]
      : facts.license ?? seed.license ?? null
    : seed.license ?? null;

  const popularity = isGh
    ? facts.stargazers_count ?? 0
    : isHf
    ? typeof facts.downloads === 'number'
      ? facts.downloads
      : 0
    : 0;

  const lastUpdated = isGh
    ? facts.pushed_at?.slice(0, 10)
    : isHf
    ? facts.lastModified?.slice(0, 10)
    : today();

  const archived = isGh ? facts.archived === true : false;
  const maturity = archived ? 'Archived / Unmaintained' : 'Production / Stable';

  const language = isGh && facts.language ? [facts.language] : [];

  return {
    title: seed.title,
    body: description,
    plain_description: description,
    technical_description: description,
    tag: deriveTag(license),
    url: seed.url ?? (isGh ? facts.html_url : seed.url) ?? '',
    github_url: seed.github_url ?? null,
    docs_url: seed.github_url ?? seed.url ?? '',
    'date-added': today(),
    slug: seed.slug,
    license,
    maturity,
    last_updated: lastUpdated,
    setup_difficulty: 'Medium',
    featured: false,
    popularity_score: popularity,
    last_verified: today(),

    language,
    hardware: [],
    deployment: [],
    model_format: [],
    use_cases: [],
    personas: [],
    features: [],
    works_with: [],
    commercial_use: deriveCommercialUse(license),

    // Trust-excluded fields (per instruction: don't worry about accuracy)
    telemetry: 'Unknown',
    offline_after_setup: 0,
    paid_support: 0,
    gui_available: 0,
    docker_available: 0,
    openai_api: 0,
    rest_api: 0,
    fine_tuning: 0,
    quantization: 0,

    min_ram_gb: null,
    recommended_ram_gb: null,

    community_notes: [],
    community_guides: [],
    community_notes_count: 0,
    community_guides_count: 0,
  };
}

// ---------- main ----------

async function main() {
  const { seeds } = JSON.parse(
    fs.readFileSync(path.join(root, 'src/data/seed.json'), 'utf-8')
  ) as { seeds: Seed[] };
  const categories = JSON.parse(
    fs.readFileSync(path.join(root, 'src/data/categories.json'), 'utf-8')
  ) as { category: string; title: string }[];

  const grouped = new Map<string, any[]>();
  let ok = 0;
  let fallback = 0;

  for (const seed of seeds) {
    let facts: any = null;
    try {
      if (seed.source === 'github') facts = await githubFacts(seed.id);
      else if (seed.source === 'huggingface') facts = await hfFacts(seed.id);
    } catch (e) {
      console.error(`✗ ${seed.slug}: ${(e as Error).message}`);
    }
    const tool = buildTool(seed, facts);
    if (facts) ok++;
    else fallback++;
    if (!grouped.has(seed.category)) grouped.set(seed.category, []);
    grouped.get(seed.category)!.push(tool);
  }

  const out = {
    tools: categories
      .filter((c) => c.category !== 'all')
      .map((c) => ({
        title: c.title,
        category: c.category,
        content: grouped.get(c.category) ?? [],
      })),
  };

  const file = path.join(root, 'src/data/tools.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
  const total = seeds.length;
  console.log(
    `\n💾 Generated ${total} tools (${ok} with live API facts, ${fallback} seed-only) → ${file}`
  );
  console.log(
    'Per category:',
    out.tools
      .map((t: any) => `${t.category}:${t.content.length}`)
      .filter((s: string) => !s.endsWith(':0'))
      .join(', ')
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
