import fs from 'fs';
import path from 'path';

// This script runs at build time on Cloudflare Pages.
// It uses the Cloudflare REST API to fetch tools from D1, since Wrangler bindings
// are not available to node scripts during the Pages build phase.

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DB_ID = process.env.D1_DB_ID; 

const dataDir = path.join(process.cwd(), 'src/data');
const toolsJsonPath = path.join(dataDir, 'tools.json');

async function main() {
  console.log("Fetching tools data from D1...");
  
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DB_ID) {
    console.warn("⚠️  Missing Cloudflare credentials in environment.");
    console.warn("Using local tools.json fallback.");
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
        sql: 'SELECT * FROM tools ORDER BY date_added DESC'
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
    
    // Format into the expected tools.json structure
    // Group by category
    const categoriesMap = new Map();
    
    for (const row of rows) {
      if (!categoriesMap.has(row.category)) {
        categoriesMap.set(row.category, []);
      }
      
      const content = categoriesMap.get(row.category);
      
      // Parse JSON arrays
      const parseJson = (val: string) => {
        try { return JSON.parse(val); } catch (e) { return []; }
      };

      content.push({
        title: row.name,
        body: row.description,
        slug: row.slug,
        url: row.url,
        tag: row.license ? (row.license === 'MIT' || row.license.includes('Apache') ? 'Free' : row.license) : 'Free',
        'date-added': row.date_added,
        license: row.license,
        language: parseJson(row.language),
        hardware: parseJson(row.hardware),
        deployment: parseJson(row.deployment),
        model_format: parseJson(row.model_format),
        maturity: row.maturity,
        last_updated: row.last_updated,
        github_stars: row.popularity_score,
        featured: row.featured === 1
      });
    }

    // Prepare final JSON
    // We would need to know the category titles. We can infer them or hardcode mapping if needed.
    // For now, we will use the category id as the title with basic formatting.
    const toolsData = {
      tools: Array.from(categoriesMap.entries()).map(([catId, content]) => ({
        title: catId.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        category: catId,
        content
      }))
    };

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(toolsJsonPath, JSON.stringify(toolsData, null, 2));
    console.log(`✅ Successfully generated tools.json with ${rows.length} tools`);
    
    // Downloading logos from R2 logic would go here.
    // For simplicity, we are assuming google favicons are used as fallback 
    // on the client side if the local image isn't found.
    
  } catch (error: any) {
    console.error("❌ Error generating data from D1:", error.message);
    process.exit(1);
  }
}

main();
