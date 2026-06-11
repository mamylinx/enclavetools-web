import type { Tool } from '../types';
import complementsData from '../data/complements.json';
import compareRowsData from '../data/compare-rows.json';

export interface ToolWithCategory extends Tool {
  category: string | string[];
}

export function categoryValue(tool: ToolWithCategory): string {
  return Array.isArray(tool.category) ? tool.category[0] || '' : tool.category || '';
}

const COMPLEMENTS = complementsData as Record<string, string[]>;

export function getWorksWith(tool: ToolWithCategory, allTools: ToolWithCategory[], limit = 4): ToolWithCategory[] {
  const category = categoryValue(tool);
  const targetCategories = COMPLEMENTS[category] || [];
  const candidates = allTools
    .filter((candidate) => candidate.slug !== tool.slug && targetCategories.includes(categoryValue(candidate)));

  return candidates
    .sort((a, b) => {
      const sharedUseCases = (b.use_cases || []).filter((value) => (tool.use_cases || []).includes(value)).length -
        (a.use_cases || []).filter((value) => (tool.use_cases || []).includes(value)).length;
      if (sharedUseCases !== 0) return sharedUseCases;
      return (b.popularity_score || 0) - (a.popularity_score || 0);
    })
    .slice(0, limit);
}

export const compareRows = compareRowsData as [string, string][];

export function formatCompareValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not specified';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString('en-US');
  if (typeof value === 'string' && value.trim()) return value;
  return 'Not specified';
}
