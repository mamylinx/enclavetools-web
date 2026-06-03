import fs from 'fs';
import path from 'path';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DB_ID = process.env.D1_DB_ID;

const dataDir = path.join(process.cwd(), 'src/data');
const outputPath = path.join(dataDir, 'category-icons.json');

const defaultIcons: Record<string, string> = {
  'llm-inference': 'cpu',
  'llm-models': 'brain',
  'vector-databases': 'database',
  'agent-frameworks': 'bot',
  'chat-interfaces': 'message-square',
  'rag-document': 'file-text',
  'speech-to-text': 'mic',
  'text-to-speech': 'volume-2',
  'image-generation': 'image',
  'fine-tuning-training': 'graduation-cap',
  'monitoring-observability': 'activity',
  'privacy-security': 'shield',
  'embedding-models': 'layers',
  'deployment': 'server',
  'workflow-automation': 'git-branch',
  'video-generation': 'video',
  'vision-multimodal': 'eye',
  'code-assistants': 'terminal',
  'data-utilities': 'bar-chart-3',
};

async function main() {
  console.log("Fetching category icons from D1...");

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DB_ID) {
    console.warn("⚠️  Missing Cloudflare credentials. Using default category icons.");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultIcons, null, 2));
    console.log("✅ Generated default category-icons.json");
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
        sql: `SELECT category_slug, icon_name FROM category_meta WHERE icon_name IS NOT NULL`
      })
    });

    if (!res.ok) throw new Error(`D1 API Error: ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(`D1 Query Error: ${JSON.stringify(json.errors)}`);

    const rows = json.result[0].results;
    const icons: Record<string, string> = { ...defaultIcons };

    for (const row of rows) {
      if (row.icon_name) icons[row.category_slug] = row.icon_name;
    }

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(icons, null, 2));
    console.log(`✅ Generated category-icons.json with ${Object.keys(icons).length} entries`);

  } catch (error: any) {
    console.error("❌ Error fetching category icons:", error.message);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultIcons, null, 2));
    console.log("⚠️  Fell back to default category-icons.json");
  }
}

main();
