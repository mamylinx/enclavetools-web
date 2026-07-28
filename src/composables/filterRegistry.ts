import type { ToolWithCategory } from '../utils/toolModel';
import type { FilterState } from '../interfaces/tool';
import { intersection, matchesDateFilter } from './oramaFilters';

type FilterPredicate = (tool: ToolWithCategory, value: unknown) => boolean;

function arrayFilter(toolField: string[] | undefined, filterValues: string[]): boolean {
  return filterValues.length === 0 || intersection(toolField || [], filterValues);
}

function valueFilter(toolField: string | null | undefined, filterValues: string[]): boolean {
  return filterValues.length === 0 || filterValues.includes(toolField || '');
}

function booleanFilter(toolField: boolean, filterValue: string | null): boolean {
  return filterValue !== 'yes' || toolField;
}

/** Registry of filter key → predicate functions for post-filtering tools. */
export const FILTER_REGISTRY: Array<{
  key: keyof FilterState;
  match: FilterPredicate;
}> = [
  {
    key: 'category',
    match: (tool, v) => {
      const cats = Array.isArray(tool.category) ? tool.category : [tool.category];
      return (v as string[]).length === 0 || (v as string[]).some((c) => cats.includes(c));
    },
  },
  { key: 'use_case', match: (t, v) => arrayFilter(t.use_cases, v as string[]) },
  { key: 'persona', match: (t, v) => arrayFilter(t.personas, v as string[]) },
  { key: 'setup_difficulty', match: (t, v) => valueFilter(t.setup_difficulty, v as string[]) },
  { key: 'license', match: (t, v) => valueFilter(t.license, v as string[]) },
  { key: 'language', match: (t, v) => arrayFilter(t.language, v as string[]) },
  { key: 'hardware', match: (t, v) => arrayFilter(t.hardware, v as string[]) },
  { key: 'deployment', match: (t, v) => arrayFilter(t.deployment, v as string[]) },
  { key: 'model_format', match: (t, v) => arrayFilter(t.model_format, v as string[]) },
  { key: 'maturity', match: (t, v) => valueFilter(t.maturity, v as string[]) },
  {
    key: 'features',
    match: (t, v) =>
      (v as string[]).length === 0 || (v as string[]).every((f) => Boolean((t as Record<string, unknown>)[f])),
  },
  { key: 'commercial_use', match: (t, v) => booleanFilter(t.commercial_use, v as string | null) },
  { key: 'offline_after_setup', match: (t, v) => booleanFilter(t.offline_after_setup, v as string | null) },
  {
    key: 'telemetry',
    match: (t, v) => {
      const val = v as string | null;
      return val !== 'None' || t.telemetry === 'None';
    },
  },
  { key: 'last_updated', match: (t, v) => !v || matchesDateFilter(t, v as string) },
];
