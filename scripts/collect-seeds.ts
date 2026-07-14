import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

type Seed = {
  source: 'github' | 'huggingface' | 'url';
  id: string;
  category: string;
  title: string;
  slug: string;
  url: string | null;
  github_url: string | null;
  license?: string | null;
};

function classify(url: string | null): { source: Seed['source']; id: string } | null {
  if (!url) return null;
  const u = url.split('?')[0];
  const gh = u.match(/github\.com\/([^/]+\/[^/]+?)\/?$/);
  if (gh) return { source: 'github', id: gh[1] };
  const hf = u.match(/huggingface\.co\/([^/]+\/[^/]+?)\/?$/);
  if (hf) return { source: 'huggingface', id: hf[1] };
  try {
    const host = new URL(u).hostname.replace(/^www\./, '');
    return { source: 'url', id: host };
  } catch {
    return null;
  }
}

function main() {
  const data = JSON.parse(
    fs.readFileSync(path.join(root, 'src/data/tools.json'), 'utf-8')
  );
  const seeds: Seed[] = [];
  const seen = new Set<string>();

  for (const cat of data.tools) {
    for (const tool of cat.content ?? []) {
      const primary = classify(tool.github_url) ?? classify(tool.url);
      if (!primary) continue;
      const key = `${primary.source}:${primary.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      seeds.push({
        source: primary.source,
        id: primary.id,
        category: cat.category,
        title: tool.title,
        slug: tool.slug,
        url: tool.url ?? null,
        github_url: tool.github_url ?? null,
        license: tool.license ?? null,
      });
    }
  }

  const out = path.join(root, 'src/data/seed.json');
  fs.writeFileSync(out, JSON.stringify({ seeds }, null, 2) + '\n');
  console.log(`💾 Wrote ${seeds.length} seeds from tools.json → ${out}`);
  const bySource = seeds.reduce<Record<string, number>>((a, s) => {
    a[s.source] = (a[s.source] ?? 0) + 1;
    return a;
  }, {});
  console.log('by source:', bySource);
}

main();
