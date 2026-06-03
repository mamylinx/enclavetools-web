import fs from 'fs';
import path from 'path';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DB_ID = process.env.D1_DB_ID;

const dataDir = path.join(process.cwd(), 'src/data');
const outputPath = path.join(dataDir, 'filter-options.json');

const defaultOptions: Record<string, Array<{ value: string; label: string }>> = {
  use_case: [
    { value: 'Self-hosted Inference', label: 'Self-hosted Inference' },
    { value: 'Document Processing', label: 'Document Processing' },
    { value: 'Internal Search', label: 'Internal Search' },
    { value: 'Workflow Automation', label: 'Workflow Automation' },
    { value: 'Contract Review', label: 'Contract Review' },
    { value: 'Clinical Notes', label: 'Clinical Notes' },
  ],
  persona: [
    { value: 'Developer', label: 'Developer' },
    { value: 'Business Owner', label: 'Business Owner' },
    { value: 'Legal', label: 'Legal' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Indie Hacker', label: 'Indie Hacker' },
  ],
  setup_difficulty: [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
  ],
  license: [
    { value: 'MIT', label: 'MIT' },
    { value: 'Apache 2.0', label: 'Apache 2.0' },
    { value: 'GPL / LGPL', label: 'GPL / LGPL' },
    { value: 'BSD', label: 'BSD' },
    { value: 'Commercial-Friendly', label: 'Commercial-Friendly' },
    { value: 'Restricted / Custom', label: 'Restricted / Custom' },
  ],
  maturity: [
    { value: 'Production / Stable', label: 'Production / Stable' },
    { value: 'Beta', label: 'Beta' },
    { value: 'Experimental', label: 'Experimental' },
    { value: 'Archived / Unmaintained', label: 'Archived / Unmaintained' },
  ],
  telemetry: [
    { value: 'None', label: 'None' },
    { value: 'Optional', label: 'Optional' },
    { value: 'On by default', label: 'On by default' },
  ],
};

async function main() {
  console.log("Fetching filter options from D1...");

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DB_ID) {
    console.warn("⚠️  Missing Cloudflare credentials. Using default filter options.");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultOptions, null, 2));
    console.log("✅ Generated default filter-options.json");
    return;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: `SELECT group_key, value, label FROM filter_options WHERE active = 1 ORDER BY group_key, sort_order ASC`
      })
    });

    if (!res.ok) throw new Error(`D1 API Error: ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(`D1 Query Error: ${JSON.stringify(json.errors)}`);

    const rows = json.result[0].results;
    const grouped: Record<string, Array<{ value: string; label: string }>> = {};

    for (const row of rows) {
      if (!grouped[row.group_key]) grouped[row.group_key] = [];
      grouped[row.group_key].push({ value: row.value, label: row.label });
    }

    const merged = { ...defaultOptions, ...grouped };

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
    console.log(`✅ Generated filter-options.json with ${Object.keys(merged).length} groups`);

  } catch (error: any) {
    console.error("❌ Error fetching filter options:", error.message);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultOptions, null, 2));
    console.log("⚠️  Fell back to default filter-options.json");
  }
}

main();
