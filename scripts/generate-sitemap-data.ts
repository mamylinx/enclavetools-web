import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generate() {
  console.log('Fetching data from Supabase...');
  
  const [categoriesRes, toolsRes] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('tools').select('*')
  ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (toolsRes.error) throw toolsRes.error;

  const categories = categoriesRes.data || [];
  const tools = toolsRes.data || [];

  // Create slug-map.json
  const slugMap: Record<string, string[]> = {};
  for (const tool of tools) {
    const cat = categories.find(c => c.id === tool.category_id);
    if (cat) {
      slugMap[tool.slug] = [cat.slug];
    }
  }

  const dataDir = path.join(__dirname, '../src/data');
  fs.writeFileSync(
    path.join(dataDir, 'slug-map.json'),
    JSON.stringify(slugMap, null, 2)
  );
  console.log('✅ Generated slug-map.json');

  // Generate category JSON files
  const toolsDir = path.join(dataDir, 'tools');
  if (!fs.existsSync(toolsDir)) {
    fs.mkdirSync(toolsDir, { recursive: true });
  }

  for (const cat of categories) {
    const catTools = tools
      .filter(t => t.category_id === cat.id)
      .map(t => ({
        title: t.title,
        body: t.body,
        tag: t.tag,
        url: t.url,
        'date-added': t.date_added,
        slug: t.slug
      }));
    
    fs.writeFileSync(
      path.join(toolsDir, `${cat.slug}.json`),
      JSON.stringify(catTools, null, 2)
    );
    console.log(`✅ Generated ${cat.slug}.json (${catTools.length} tools)`);
  }

  console.log(`\n🎉 Generated ${categories.length} category files and slug-map.json`);
}

generate().catch(console.error);
