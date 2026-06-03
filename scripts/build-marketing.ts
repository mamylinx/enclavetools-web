import fs from 'fs';
import path from 'path';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DB_ID = process.env.D1_DB_ID;

const dataDir = path.join(process.cwd(), 'src/data');
const outputPath = path.join(dataDir, 'marketing.json');

const defaultMarketing = {
  featured: [
    { title: 'Put your tool at the top', description: 'Featured listings get 10× more clicks and are shown prominently across the directory.', cta: 'Get featured →', url: '/submit' }
  ],
  promoted: [
    { label: 'Offgrid AI tools · Updated daily', title: 'Enclavetools', description: 'Stop paying for AI APIs. Everything here runs on your hardware.', cta: 'Publish yours now →', url: '/submit' }
  ],
  sponsors: [
    { logo: null, description: 'Reach 50,000+ enterprise buyers looking for private AI solutions.', cta: 'Sponsor the directory →', url: '/submit' }
  ]
};

async function main() {
  console.log("Fetching marketing cards from D1...");

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DB_ID) {
    console.warn("⚠️  Missing Cloudflare credentials. Using default marketing data.");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultMarketing, null, 2));
    console.log("✅ Generated default marketing.json");
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
        sql: `SELECT * FROM marketing_cards WHERE active = 1 ORDER BY sort_order ASC`
      })
    });

    if (!res.ok) throw new Error(`D1 API Error: ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(`D1 Query Error: ${JSON.stringify(json.errors)}`);

    const rows = json.result[0].results;
    const marketing: Record<string, any[]> = { featured: [], promoted: [], sponsors: [] };

    for (const row of rows) {
      if (marketing[row.type]) {
        marketing[row.type].push({
          label: row.label || undefined,
          title: row.title,
          description: row.description,
          cta: row.cta || undefined,
          url: row.url || undefined,
          logo: row.logo || undefined,
        });
      }
    }

    for (const type of ['featured', 'promoted', 'sponsors'] as const) {
      if (marketing[type].length === 0) {
        marketing[type] = defaultMarketing[type];
      }
    }

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(marketing, null, 2));
    console.log(`✅ Generated marketing.json`);

  } catch (error: any) {
    console.error("❌ Error fetching marketing cards:", error.message);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultMarketing, null, 2));
    console.log("⚠️  Fell back to default marketing.json");
  }
}

main();
