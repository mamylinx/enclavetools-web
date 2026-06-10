import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const inputPath = path.join(process.cwd(), 'src/data/tools.json');
const outputPath = path.join(process.cwd(), 'wrangler/d1/seed.sql');

if (!fs.existsSync(inputPath)) {
  console.error(`tools.json not found at ${inputPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

let sql = `INSERT INTO tools (
  id, name, slug, description, url, github_url, category, license, 
  language, hardware, deployment, model_format, maturity, featured, 
  popularity_score, date_added, last_updated, logo_source, created_at
) VALUES\n`;

const values: string[] = [];

// Format helper
const esc = (val: any) => {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (Array.isArray(val)) return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${val}'`;
};

for (const categoryObj of data.tools) {
  const category = categoryObj.category;
  
  for (const tool of categoryObj.content) {
    const id = crypto.randomUUID();
    const name = tool.title || '';
    const slug = tool.slug || '';
    const description = tool.body || '';
    const url = tool.url || null;
    const github_url = tool.url?.includes('github.com') ? tool.url : null;
    const license = tool.license || null;
    const language = tool.language || [];
    const hardware = tool.hardware || [];
    const deployment = tool.deployment || [];
    const model_format = tool.model_format || [];
    const maturity = tool.maturity || null;
    const featured = tool.featured ? 1 : 0;
    const popularity_score = tool.github_stars || 0;
    const date_added = tool['date-added'] || new Date().toISOString().split('T')[0];
    const last_updated = tool.last_updated || date_added;
    const logo_source = 'google'; // Defaulting to google fallback for initial
    const created_at = new Date().toISOString();

    const row = `(${esc(id)}, ${esc(name)}, ${esc(slug)}, ${esc(description)}, ${esc(url)}, ${esc(github_url)}, ${esc(category)}, ${esc(license)}, ${esc(language)}, ${esc(hardware)}, ${esc(deployment)}, ${esc(model_format)}, ${esc(maturity)}, ${esc(featured)}, ${esc(popularity_score)}, ${esc(date_added)}, ${esc(last_updated)}, ${esc(logo_source)}, ${esc(created_at)})`;
    
    values.push(row);
  }
}

sql += values.join(',\n') + ';\n';

fs.writeFileSync(outputPath, sql);
console.log(`✅ Seed SQL generated at ${outputPath}`);
console.log(`Run: npx wrangler d1 execute enclavetools-db --local --file=wrangler/d1/seed.sql`);
