import type { ToolWithCategory } from '../utils/toolModel';
import type { FilterState } from '../interfaces/tool';
import { FILTER_REGISTRY } from './filterRegistry';

/** Checks if a tool's last-updated date falls within the given range (30d/6m/1y). */
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

/** Returns true if any element of arr2 exists in arr1. */
export function intersection(arr1: string[], arr2: string[]): boolean {
  return arr2.length === 0 || arr2.some((v) => arr1.includes(v));
}

/** Filters tools in-memory using the full FILTER_REGISTRY predicates. */
export function postFilter(tools: ToolWithCategory[], filters: FilterState): ToolWithCategory[] {
  return tools.filter((tool) =>
    FILTER_REGISTRY.every(({ key, match }) => match(tool, filters[key])),
  );
}
