import fs from 'fs';
import path from 'path';

// This script runs at build time on Cloudflare Pages.
// It uses the Cloudflare REST API to fetch categories from D1.

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DB_ID = process.env.D1_DB_ID; 

const dataDir = path.join(process.cwd(), 'src/data');
const categoriesJsonPath = path.join(dataDir, 'categories.json');

async function main() {
  console.log("Fetching categories data from D1...");
  
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DB_ID) {
    console.warn("⚠️  Missing Cloudflare credentials in environment.");
    console.warn("Using local categories.json fallback.");
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
        sql: 'SELECT title, slug as category FROM categories ORDER BY sort_order ASC'
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`D1 API Error: ${res.status} ${errorText}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(`D1 Query Error: ${JSON.stringify(json.errors)}`);
    }

    const rows = json.result[0].results;
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(categoriesJsonPath, JSON.stringify(rows, null, 2));
    console.log(`✅ Successfully generated categories.json with ${rows.length} categories`);
    
  } catch (error: any) {
    console.error("❌ Error generating categories from D1:", error.message);
    process.exit(1);
  }
}

main();
