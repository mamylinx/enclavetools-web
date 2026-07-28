import type { FilterState } from '../types';

/** Describes one filterable field in FilterState: its key, URL param, value type, display label, and inactive default. */
export interface FilterDefinition<K extends keyof FilterState = keyof FilterState> {
  key: K;
  param: string;
  type: 'sort' | 'multi' | 'single';
  label: string;
  defaultValue: FilterState[K];
}

/** Single source of truth for all filter fields — drives serialization, counting, display, and API params. */
export const FILTER_DEFINITIONS: FilterDefinition[] = [
  { key: 'sort', param: 'sort', type: 'sort', label: 'Sort', defaultValue: 'featured' },
  { key: 'category', param: 'cat', type: 'multi', label: 'Category', defaultValue: [] },
  { key: 'use_case', param: 'use', type: 'multi', label: 'Use Case', defaultValue: [] },
  { key: 'persona', param: 'persona', type: 'multi', label: 'Persona', defaultValue: [] },
  { key: 'setup_difficulty', param: 'setup', type: 'multi', label: 'Setup', defaultValue: [] },
  { key: 'license', param: 'license', type: 'multi', label: 'License', defaultValue: [] },
  { key: 'language', param: 'lang', type: 'multi', label: 'Language', defaultValue: [] },
  { key: 'hardware', param: 'hw', type: 'multi', label: 'Hardware', defaultValue: [] },
  { key: 'deployment', param: 'deploy', type: 'multi', label: 'Deployment', defaultValue: [] },
  { key: 'model_format', param: 'format', type: 'multi', label: 'Model Format', defaultValue: [] },
  { key: 'maturity', param: 'mat', type: 'multi', label: 'Maturity', defaultValue: [] },
  { key: 'features', param: 'feature', type: 'multi', label: 'Feature', defaultValue: [] },
  { key: 'commercial_use', param: 'commercial', type: 'single', label: 'Commercial Use', defaultValue: null },
  { key: 'offline_after_setup', param: 'offline', type: 'single', label: 'Offline', defaultValue: null },
  { key: 'telemetry', param: 'telemetry', type: 'single', label: 'Telemetry', defaultValue: null },
  { key: 'last_updated', param: 'updated', type: 'single', label: 'Last Updated', defaultValue: null },
];

/** Maps URL param → FilterState key. */
export const PARAM_MAP = new Map(FILTER_DEFINITIONS.map((d) => [d.param, d.key]));

/** Maps FilterState key → definition. */
export const KEY_MAP = new Map(FILTER_DEFINITIONS.map((d) => [d.key, d]));

/** FilterState keys that store arrays. */
export const ARRAY_KEYS = new Set(FILTER_DEFINITIONS.filter((d) => d.type === 'multi').map((d) => d.key));

/** Returns a fresh FilterState with all defaults. */
export function createDefaultState(): FilterState {
  return Object.fromEntries(FILTER_DEFINITIONS.map((d) => [d.key, d.defaultValue])) as FilterState;
}

/** Returns true if any non-default filter value is set. */
export function hasActiveFilters(state: FilterState): boolean {
  return FILTER_DEFINITIONS.some((def) => {
    const val = state[def.key];
    if (def.type === 'sort') return val !== def.defaultValue;
    if (def.type === 'multi') return (val as string[]).length > 0;
    return val !== null;
  });
}

/** Counts how many filters are actively set. */
export function countActiveFilters(state: FilterState): number {
  return FILTER_DEFINITIONS.reduce((count, def) => {
    const val = state[def.key];
    if (def.type === 'sort') return count + (val !== def.defaultValue ? 1 : 0);
    if (def.type === 'multi') return count + (val as string[]).length;
    return count + (val ? 1 : 0);
  }, 0);
}

/** Converts filter state into a flat display list for active filter chips. */
export function getActiveFiltersForDisplay(state: FilterState): Array<{ group: string; label: string; value: string }> {
  const result: Array<{ group: string; label: string; value: string }> = [];
  for (const def of FILTER_DEFINITIONS) {
    const val = state[def.key];
    if (def.type === 'sort') {
      if (val !== def.defaultValue) result.push({ group: def.label, label: def.label, value: val as string });
    } else if (def.type === 'multi') {
      (val as string[]).forEach((v) => result.push({ group: def.label, label: def.label, value: v }));
    } else if (val) {
      result.push({ group: def.label, label: def.label, value: val as string });
    }
  }
  return result;
}

/** Converts filter state into URLSearchParams for API requests. */
export function toApiParams(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  for (const def of FILTER_DEFINITIONS) {
    const val = state[def.key];
    if (def.type === 'sort') {
      if (val !== def.defaultValue) params.set(def.param, val as string);
    } else if (def.type === 'multi') {
      (val as string[]).forEach((v) => params.append(def.param, v));
    } else if (val) {
      params.set(def.param, val as string);
    }
  }
  return params;
}
