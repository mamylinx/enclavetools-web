import fs from 'fs';
import path from 'path';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DB_ID = process.env.D1_DB_ID;

const dataDir = path.join(process.cwd(), 'src/data');
const outputPath = path.join(dataDir, 'compare-rows.json');

const defaultCompareRows: [string, string][] = [
  ['License', 'license'],
  ['Commercial use', 'commercial_use'],
  ['Setup difficulty', 'setup_difficulty'],
  ['GitHub stars', 'popularity_score'],
  ['Last updated', 'last_updated'],
  ['OpenAI API', 'openai_api'],
  ['REST API', 'rest_api'],
  ['Fine-tuning', 'fine_tuning'],
  ['Quantization', 'quantization'],
  ['Docker', 'docker_available'],
  ['GUI / no-code', 'gui_available'],
  ['Offline after setup', 'offline_after_setup'],
  ['Telemetry', 'telemetry'],
  ['Minimum RAM', 'min_ram_gb'],
  ['Recommended RAM', 'recommended_ram_gb'],
  ['Hardware', 'hardware'],
  ['Deployment', 'deployment'],
  ['Model format', 'model_format'],
];

async function main() {
  console.log('Fetching compare rows from D1...');

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DB_ID) {
    console.warn('Missing Cloudflare credentials. Using default compare rows.');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultCompareRows, null, 2));
    console.log('Generated default compare-rows.json');
    return;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: 'SELECT label, field_key FROM compare_rows ORDER BY sort_order ASC' }),
    });

    if (!res.ok) throw new Error(`D1 API Error: ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(`D1 Query Error: ${JSON.stringify(json.errors)}`);

    const rows = json.result[0].results;
    const content: [string, string][] = rows.map((row: any) => [row.label, row.field_key]);

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));
    console.log(`Generated compare-rows.json with ${content.length} entries`);
  } catch (error: any) {
    console.error('Error fetching compare rows:', error.message);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultCompareRows, null, 2));
    console.log('Fell back to default compare-rows.json');
  }
}

main();
