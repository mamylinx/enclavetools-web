import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { compileData } from '../compile-data';

const root = path.resolve(__dirname, '../..');
const metadataToolsDir = path.join(root, 'src/data/metadata/tools');
const categoriesFile = path.join(root, 'src/data/categories.json');
const toolsJsonFile = path.join(root, 'src/data/generated/tools.json');
const slugMapFile = path.join(root, 'src/data/generated/slug-map.json');

describe('compile-data pipeline', () => {
  it('should compile metadata/tools without errors', async () => {
    await compileData();

    expect(fs.existsSync(toolsJsonFile)).toBe(true);
    expect(fs.existsSync(slugMapFile)).toBe(true);

    const toolsData = JSON.parse(fs.readFileSync(toolsJsonFile, 'utf-8'));
    expect(Array.isArray(toolsData.tools)).toBe(true);
    expect(toolsData.tools.length).toBeGreaterThan(0);

    const toolFiles = fs.readdirSync(metadataToolsDir).filter(f => f.endsWith('.json'));
    const totalCompiled = toolsData.tools.reduce((sum: number, cat: any) => sum + cat.content.length, 0);
    expect(totalCompiled).toBe(toolFiles.length);

    const slugMap = JSON.parse(fs.readFileSync(slugMapFile, 'utf-8'));
    expect(Object.keys(slugMap).length).toBe(toolFiles.length);
  });

  it('all tool files have valid slug matching their filename', () => {
    const files = fs.readdirSync(metadataToolsDir).filter(f => f.endsWith('.json'));
    const categories: { category: string }[] = JSON.parse(fs.readFileSync(categoriesFile, 'utf-8'));
    const validCats = new Set(categories.filter(c => c.category !== 'all').map(c => c.category));

    for (const file of files) {
      const tool = JSON.parse(fs.readFileSync(path.join(metadataToolsDir, file), 'utf-8'));
      const expectedSlug = path.basename(file, '.json');

      expect(tool.slug).toBe(expectedSlug);
      expect(typeof tool.title).toBe('string');
      expect(tool.title.length).toBeGreaterThan(0);
      expect(validCats.has(tool.category)).toBe(true);
    }
  });
});
