import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Tool, Category, ToolsConfig, SlugMap } from '../src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

// ==========================================
// 1. Paths Configuration
// ==========================================
const PATHS = {
  metadataToolsDir: path.join(root, 'src/data/metadata/tools'),
  categoriesFile: path.join(root, 'src/data/categories.json'),
  toolsJsonFile: path.join(root, 'src/data/generated/tools.json'),
  generatedToolsDir: path.join(root, 'src/data/generated/tools'),
  generatedSlugMapFile: path.join(root, 'src/data/generated/slug-map.json'),
  generatedToolMetadataDir: path.join(root, 'src/data/generated/tool-metadata'),
};

// ==========================================
// 2. Types & Interfaces
// ==========================================
interface CategoryMeta {
  title: string;
  category: string;
  icon?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ==========================================
// 3. Tool Loader & Validator
// ==========================================
class ToolLoader {
  static loadCategories(categoriesPath: string): CategoryMeta[] {
    if (!fs.existsSync(categoriesPath)) {
      throw new Error(`Categories file not found at: ${categoriesPath}`);
    }
    const raw = fs.readFileSync(categoriesPath, 'utf-8');
    return JSON.parse(raw);
  }

  static loadAllTools(toolsDir: string, validCategories: Set<string>): { tools: Tool[]; errors: string[] } {
    if (!fs.existsSync(toolsDir)) {
      fs.mkdirSync(toolsDir, { recursive: true });
      return { tools: [], errors: [`Metadata tools directory was empty or missing at ${toolsDir}`] };
    }

    const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.json'));
    const tools: Tool[] = [];
    const errors: string[] = [];
    const seenSlugs = new Set<string>();

    for (const file of files) {
      const filePath = path.join(toolsDir, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const tool: Tool & { category: string } = JSON.parse(raw);
        const validation = this.validateTool(tool, file, validCategories, seenSlugs);

        if (!validation.valid) {
          errors.push(...validation.errors);
        } else {
          seenSlugs.add(tool.slug);
          tools.push(tool);
        }
      } catch (err: any) {
        errors.push(`[${file}] Failed to read/parse JSON: ${err.message}`);
      }
    }

    return { tools, errors };
  }

  private static validateTool(
    tool: any,
    fileName: string,
    validCategories: Set<string>,
    seenSlugs: Set<string>
  ): ValidationResult {
    const errors: string[] = [];
    const expectedSlug = path.basename(fileName, '.json');

    if (!tool.slug) {
      errors.push(`[${fileName}] Missing required 'slug' property.`);
    } else if (tool.slug !== expectedSlug) {
      errors.push(`[${fileName}] Slug mismatch: slug '${tool.slug}' does not match filename '${expectedSlug}'.`);
    } else if (seenSlugs.has(tool.slug)) {
      errors.push(`[${fileName}] Duplicate slug detected: '${tool.slug}'.`);
    }

    if (!tool.title) {
      errors.push(`[${fileName}] Missing required 'title' property.`);
    }

    if (!tool.category) {
      errors.push(`[${fileName}] Missing required 'category' property.`);
    } else if (!validCategories.has(tool.category)) {
      errors.push(`[${fileName}] Invalid category '${tool.category}'. Must be one of: ${[...validCategories].join(', ')}.`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ==========================================
// 4. Data Aggregator
// ==========================================
class DataAggregator {
  static groupByCategory(tools: Tool[], categories: CategoryMeta[]): ToolsConfig {
    const grouped = new Map<string, Tool[]>();

    // Initialize all categories (excluding 'all')
    categories
      .filter(c => c.category !== 'all')
      .forEach(c => grouped.set(c.category, []));

    // Distribute tools to their category
    for (const tool of tools) {
      const cat = (tool as any).category;
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
      }
      grouped.get(cat)!.push(tool);
    }

    // Sort tools within each category by popularity_score (descending)
    for (const [cat, list] of grouped.entries()) {
      list.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0));
    }

    const compiledCategories: Category[] = categories
      .filter(c => c.category !== 'all')
      .map(c => ({
        title: c.title,
        category: c.category,
        content: grouped.get(c.category) || [],
      }));

    return { tools: compiledCategories };
  }

  static buildSlugMap(tools: Tool[]): SlugMap {
    const slugMap: SlugMap = {};
    for (const tool of tools) {
      if (tool.slug) {
        const cat = (tool as any).category || '';
        slugMap[tool.slug] = [cat];
      }
    }
    return slugMap;
  }
}

// ==========================================
// 5. Artifact Writers
// ==========================================
class ArtifactWriter {
  static writeMasterToolsJson(outputPath: string, data: ToolsConfig): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2) + '\n');
  }

  static writeCategoryFiles(outputDir: string, categories: Category[]): void {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    for (const cat of categories) {
      const filePath = path.join(outputDir, `${cat.category}.json`);
      fs.writeFileSync(filePath, JSON.stringify(cat.content, null, 2) + '\n');
    }
  }

  static writeSlugMap(outputPath: string, slugMap: SlugMap): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(slugMap, null, 2) + '\n');
  }

  static writeToolMetadataFiles(outputDir: string, tools: Tool[]): void {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    for (const tool of tools) {
      const minimalMetadata = {
        title: tool.title,
        description: tool.body,
        category: (tool as any).category,
        url: tool.url,
        tag: tool.tag,
        'date-added': tool['date-added'],
        slug: tool.slug,
      };
      const filePath = path.join(outputDir, `${tool.slug}.json`);
      fs.writeFileSync(filePath, JSON.stringify(minimalMetadata, null, 2) + '\n');
    }
  }
}

// ==========================================
// 6. Main Compiler Orchestrator
// ==========================================
export async function compileData(): Promise<void> {
  console.log('⚡ [compile-data] Starting data compilation from src/data/metadata/tools/ ...\n');

  // Step 1: Load categories
  const categories = ToolLoader.loadCategories(PATHS.categoriesFile);
  const validCategorySlugs = new Set(
    categories.filter(c => c.category !== 'all').map(c => c.category)
  );

  // Step 2: Load and validate all tool metadata files
  const { tools, errors } = ToolLoader.loadAllTools(PATHS.metadataToolsDir, validCategorySlugs);

  if (errors.length > 0) {
    console.error('❌ [compile-data] Validation failed with errors:');
    errors.forEach(err => console.error(`   ${err}`));
    process.exit(1);
  }

  console.log(`✅ [compile-data] Validated ${tools.length} tool definition files.`);

  // Step 3: Aggregate into master dataset and slug map
  const toolsConfig = DataAggregator.groupByCategory(tools, categories);
  const slugMap = DataAggregator.buildSlugMap(tools);

  // Step 4: Write all output artifacts
  ArtifactWriter.writeMasterToolsJson(PATHS.toolsJsonFile, toolsConfig);
  console.log(`✅ [compile-data] Generated master: src/data/generated/tools.json (${tools.length} tools across ${toolsConfig.tools.length} categories)`);

  ArtifactWriter.writeCategoryFiles(PATHS.generatedToolsDir, toolsConfig.tools);
  console.log(`✅ [compile-data] Generated ${toolsConfig.tools.length} category files in: src/data/generated/tools/`);

  ArtifactWriter.writeSlugMap(PATHS.generatedSlugMapFile, slugMap);
  console.log(`✅ [compile-data] Generated slug map: src/data/generated/slug-map.json`);

  ArtifactWriter.writeToolMetadataFiles(PATHS.generatedToolMetadataDir, tools);
  console.log(`✅ [compile-data] Generated ${tools.length} individual metadata files in: src/data/generated/tool-metadata/`);

  console.log('\n✨ [compile-data] Compilation finished successfully!\n');
}

// Direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  compileData().catch(err => {
    console.error('❌ [compile-data] Fatal error:', err);
    process.exit(1);
  });
}
