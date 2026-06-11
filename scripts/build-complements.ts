import fs from 'fs';
import path from 'path';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DB_ID = process.env.D1_DB_ID;

const dataDir = path.join(process.cwd(), 'src/data');
const outputPath = path.join(dataDir, 'complements.json');

const defaultComplements: Record<string, string[]> = {
  'llm-inference': ['chat-interfaces', 'rag-document', 'deployment', 'monitoring-observability'],
  'llm-models': ['llm-inference', 'chat-interfaces', 'fine-tuning-training'],
  'chat-interfaces': ['llm-inference', 'llm-models', 'rag-document'],
  'rag-document': ['vector-databases', 'embedding-models', 'llm-inference', 'chat-interfaces'],
  'vector-databases': ['embedding-models', 'rag-document'],
  'embedding-models': ['vector-databases', 'rag-document'],
  'fine-tuning-training': ['llm-models', 'deployment', 'monitoring-observability'],
  'workflow-automation': ['agent-frameworks', 'chat-interfaces', 'rag-document'],
  'agent-frameworks': ['llm-inference', 'workflow-automation', 'monitoring-observability'],
};

async function main() {
  console.log('Fetching complements from D1...');

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DB_ID) {
    console.warn('Missing Cloudflare credentials. Using default complements.');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultComplements, null, 2));
    console.log('Generated default complements.json');
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
      body: JSON.stringify({ sql: 'SELECT category_slug, complements FROM complements' }),
    });

    if (!res.ok) throw new Error(`D1 API Error: ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(`D1 Query Error: ${JSON.stringify(json.errors)}`);

    const rows = json.result[0].results;
    const content: Record<string, string[]> = {};

    for (const row of rows) {
      content[row.category_slug] = JSON.parse(row.complements);
    }

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));
    console.log(`Generated complements.json with ${Object.keys(content).length} entries`);
  } catch (error: any) {
    console.error('Error fetching complements:', error.message);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(defaultComplements, null, 2));
    console.log('Fell back to default complements.json');
  }
}

main();
