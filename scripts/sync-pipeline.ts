import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

const datasetPath = path.join(root, 'enclavetools-pipeline/dataset.json');
const categoriesPath = path.join(root, 'src/data/categories.json');

console.log('🔄 Starting dataset sync pipeline...\n');

if (!fs.existsSync(datasetPath)) {
  console.error(`❌ Error: ${datasetPath} not found. Please run the pipeline first.`);
  process.exit(1);
}

const dataset: any[] = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
const categories: { title: string; category: string }[] = JSON.parse(
  fs.readFileSync(categoriesPath, 'utf-8')
);

const metadataToolsDir = path.join(root, 'src/data/metadata/tools');

if (!fs.existsSync(metadataToolsDir)) {
  fs.mkdirSync(metadataToolsDir, { recursive: true });
}

let count = 0;
for (const tool of dataset) {
  if (!tool.slug) {
    console.warn(`⚠️ Skipping tool without slug: ${tool.title}`);
    continue;
  }
  const filePath = path.join(metadataToolsDir, `${tool.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(tool, null, 2) + '\n');
  count++;
}

console.log(`✅ Successfully synced ${count} tools into ${metadataToolsDir}`);

console.log('\n🚀 Running prepare-data to update derived files...');
try {
  execSync('bun run prepare-data', { cwd: root, stdio: 'inherit' });
  console.log('\n✨ Dataset sync complete!');
} catch (error: any) {
  console.error('❌ Failed running prepare-data:', error.message);
  process.exit(1);
}
