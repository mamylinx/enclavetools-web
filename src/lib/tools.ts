import toolsData from '../data/generated/tools.json';
import { categoryValue, type ToolWithCategory } from '../utils/toolModel';

interface ToolsConfig {
  tools: Array<{ category: string; title: string; content: unknown[] }>;
}

const data = toolsData as ToolsConfig;

/** Flatten all tools across categories into a single array. */
export function getAllTools(): ToolWithCategory[] {
  return data.tools.flatMap((cat) =>
    cat.content.map((tool) => ({ ...tool, category: cat.category })),
  );
}

/** Get a single tool by slug. Returns undefined if not found. */
export function getToolBySlug(slug: string): ToolWithCategory | undefined {
  return getAllTools().find((t) => t.slug === slug);
}

/** Get all tool slugs for getStaticPaths(). */
export function getAllToolSlugs(): Array<{ params: { slug: string } }> {
  return getAllTools()
    .filter((t) => t.slug)
    .map((tool) => ({ params: { slug: tool.slug! } }));
}

/** Get tools in the same category, sorted by popularity. */
export function getRelatedTools(
  tool: ToolWithCategory,
  limit = 4,
): ToolWithCategory[] {
  const category = categoryValue(tool);
  return getAllTools()
    .filter((t) => categoryValue(t) === category && t.slug !== tool.slug)
    .sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
    .slice(0, limit);
}

/** Get category counts. */
export function getCategoryCounts(): Map<string, number> {
  return new Map(
    data.tools.map((cat) => [cat.category, cat.content.length]),
  );
}


