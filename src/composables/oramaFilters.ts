import type { ToolWithCategory } from '../utils/toolModel';
import type { FilterState } from '../interfaces/tool';
import { FILTER_REGISTRY } from './filterRegistry';

export function matchesDateFilter(tool: ToolWithCategory, lastUpdated: string): boolean {
  const ts = tool.last_updated || tool['date-added'];
  if (!ts) return false;
  const now = Date.now();
  const updated = new Date(ts).getTime();
  const diff = now - updated;
  if (lastUpdated === '30d') return diff <= 30 * 24 * 60 * 60 * 1000;
  if (lastUpdated === '6m') return diff <= 180 * 24 * 60 * 60 * 1000;
  if (lastUpdated === '1y') return diff <= 365 * 24 * 60 * 60 * 1000;
  return true;
}

export function intersection(arr1: string[], arr2: string[]): boolean {
  return arr2.length === 0 || arr2.some((v) => arr1.includes(v));
}

export function postFilter(tools: ToolWithCategory[], filters: FilterState): ToolWithCategory[] {
  return tools.filter((tool) =>
    FILTER_REGISTRY.every(({ key, match }) => match(tool, filters[key])),
  );
}
