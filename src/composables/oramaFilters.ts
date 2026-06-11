import type { ToolWithCategory } from '../utils/toolModel';
import type { FilterState } from '../interfaces/tool';

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
  return tools.filter((tool) => {
    if (filters.category.length > 0) {
      const cats = Array.isArray(tool.category) ? tool.category : [tool.category];
      if (!filters.category.some((c) => cats.includes(c))) return false;
    }
    if (filters.use_case.length > 0) {
      if (!intersection(tool.use_cases || [], filters.use_case)) return false;
    }
    if (filters.persona.length > 0) {
      if (!intersection(tool.personas || [], filters.persona)) return false;
    }
    if (filters.setup_difficulty.length > 0) {
      if (!filters.setup_difficulty.includes(tool.setup_difficulty || '')) return false;
    }
    if (filters.license.length > 0) {
      if (!filters.license.includes(tool.license || '')) return false;
    }
    if (filters.language.length > 0) {
      if (!intersection(tool.language || [], filters.language)) return false;
    }
    if (filters.hardware.length > 0) {
      if (!intersection(tool.hardware || [], filters.hardware)) return false;
    }
    if (filters.deployment.length > 0) {
      if (!intersection(tool.deployment || [], filters.deployment)) return false;
    }
    if (filters.model_format.length > 0) {
      if (!intersection(tool.model_format || [], filters.model_format)) return false;
    }
    if (filters.maturity.length > 0) {
      if (!filters.maturity.includes(tool.maturity || '')) return false;
    }
    if (filters.features.length > 0) {
      if (!filters.features.every((f) => Boolean((tool as Record<string, unknown>)[f]))) return false;
    }
    if (filters.commercial_use === 'yes' && !tool.commercial_use) return false;
    if (filters.offline_after_setup === 'yes' && !tool.offline_after_setup) return false;
    if (filters.telemetry === 'None' && tool.telemetry !== 'None') return false;
    if (filters.last_updated && !matchesDateFilter(tool, filters.last_updated)) return false;
    return true;
  });
}
