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

function parseJson(val: unknown): string[] {
  if (!val || typeof val !== 'string') return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function boolFromRow(value: unknown, fallback = false): boolean {
  if (value === 1 || value === true || value === '1' || value === 'true') return true;
  if (value === 0 || value === false || value === '0' || value === 'false') return false;
  return fallback;
}

function inferToolFields(row: any) {
  const category = row.category || '';
  const description = row.description || '';
  const lower = `${row.name || ''} ${description} ${category}`.toLowerCase();
  const hardware = parseJson(row.hardware);
  const deployment = parseJson(row.deployment);
  const modelFormat = parseJson(row.model_format);
  const license = row.license || 'Other';

  const docker = deployment.includes('Docker');
  const gui = category === 'chat-interfaces' || lower.includes('gui') || lower.includes('no-code') || lower.includes('visual');
  const openaiApi = lower.includes('openai') || lower.includes('oai compatible');
  const restApi = openaiApi || lower.includes('api') || category === 'deployment';
  const fineTuning = category === 'fine-tuning-training' || lower.includes('fine-tun');
  const quantization = modelFormat.some((format) => ['GGUF', 'GPTQ', 'AWQ'].includes(format)) || lower.includes('quant');
  const lowResource = hardware.some((item) => item.includes('Low-resource'));
  const gpuOnly = hardware.length > 0 && hardware.every((item) => item.includes('GPU') || item.includes('CUDA') || item.includes('ROCm'));

  const useCases = new Set<string>();
  const personas = new Set<string>(['Developer']);
  if (['rag-document', 'data-processing'].includes(category)) {
    useCases.add('Document Processing');
    useCases.add('Internal Search');
    personas.add('Business Owner');
    personas.add('Legal');
  }
  if (category === 'chat-interfaces') {
    useCases.add('Clinical Notes');
    useCases.add('Internal Search');
    personas.add('Healthcare');
    personas.add('Business Owner');
  }
  if (category === 'llm-inference') {
    useCases.add('Self-hosted Inference');
    personas.add('Indie Hacker');
  }
  if (category === 'workflow-automation') {
    useCases.add('Workflow Automation');
    personas.add('Business Owner');
  }
  if (lower.includes('contract') || lower.includes('legal')) {
    useCases.add('Contract Review');
    personas.add('Legal');
  }

  return {
    language: parseJson(row.language),
    hardware,
    deployment,
    model_format: modelFormat,
    commercial_use: !/agpl|non-commercial|cc by-nc/i.test(license),
    setup_difficulty: row.setup_difficulty || (gui || lowResource ? 'Low' : docker ? 'Medium' : gpuOnly ? 'High' : 'Medium'),
    use_cases: parseJson(row.use_cases).length ? parseJson(row.use_cases) : Array.from(useCases),
    personas: parseJson(row.personas).length ? parseJson(row.personas) : Array.from(personas),
    features: parseJson(row.features),
    works_with: parseJson(row.works_with),
    docs_url: row.docs_url || row.github_url || row.url,
    community_guides: parseJson(row.community_guides),
    community_notes: parseJson(row.community_notes),
    min_ram_gb: Number(row.min_ram_gb || (lowResource ? 8 : gpuOnly ? 16 : 8)),
    recommended_ram_gb: Number(row.recommended_ram_gb || (gpuOnly ? 32 : 16)),
    telemetry: row.telemetry || 'None',
    offline_after_setup: boolFromRow(row.offline_after_setup, true),
    paid_support: boolFromRow(row.paid_support, Boolean(row.url && !String(row.url).includes('github.com'))),
    gui_available: boolFromRow(row.gui_available, gui),
    docker_available: boolFromRow(row.docker_available, docker),
    openai_api: boolFromRow(row.openai_api, openaiApi),
    rest_api: boolFromRow(row.rest_api, restApi),
    fine_tuning: boolFromRow(row.fine_tuning, fineTuning),
    quantization: boolFromRow(row.quantization, quantization),
    community_notes_count: Number(row.community_notes_count || 0),
    community_guides_count: Number(row.community_guides_count || 0),
    last_verified: row.last_verified || row.last_updated || row.date_added,
  };
}

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
      
      const inferred = inferToolFields(row);

      content.push({
        title: row.name,
        body: row.description,
        plain_description: row.plain_description || row.description,
        technical_description: row.technical_description || row.description,
        slug: row.slug,
        url: row.url,
        github_url: row.github_url,
        docs_url: inferred.docs_url,
        tag: row.license ? (row.license === 'MIT' || row.license.includes('Apache') ? 'Free' : row.license) : 'Free',
        'date-added': row.date_added,
        license: row.license,
        language: inferred.language,
        hardware: inferred.hardware,
        deployment: inferred.deployment,
        model_format: inferred.model_format,
        maturity: row.maturity,
        last_updated: row.last_updated,
        popularity_score: row.popularity_score,
        ...inferred,
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
