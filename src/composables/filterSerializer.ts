import type { FilterState } from '../types';
import { localStorageAdapter as storage } from '../lib/storage';
import { PARAM_MAP, KEY_MAP, ARRAY_KEYS, createDefaultState, hasActiveFilters } from './filterDefinitions';

export { createDefaultState, hasActiveFilters };

const STORAGE_KEY = 'enclavetools-filters';

/** Loads a previously persisted FilterState from localStorage. */
export function loadFromStorage(): FilterState | null {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

/** Persists the current FilterState to localStorage. */
export function saveToStorage(state: FilterState) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/** Parses the current URL search params into a FilterState. */
export function parseFromUrl(): FilterState {
  const state = createDefaultState();
  const params = new URLSearchParams(window.location.search);

  for (const [param, key] of PARAM_MAP) {
    const values = params.getAll(param);
    if (values.length === 0) continue;

    if (ARRAY_KEYS.has(key as keyof FilterState)) {
      (state[key as keyof FilterState] as string[]) = values;
    } else {
      (state[key as keyof FilterState] as string) = values[0] || '';
    }
  }

  return state;
}

/** Pushes the current FilterState to the browser URL via history.replaceState. */
export function syncToUrl(state: FilterState) {
  const params = new URLSearchParams();

  for (const [param, key] of PARAM_MAP) {
    const def = KEY_MAP.get(key as keyof FilterState);
    if (!def) continue;
    const value = state[key as keyof FilterState];

    if (def.type === 'multi') {
      (value as string[]).forEach((v) => params.append(param, v));
    } else if (def.type === 'single' && value) {
      params.set(param, value as string);
    } else if (def.type === 'sort' && value !== def.defaultValue) {
      params.set(param, value as string);
    }
  }

  const currentParams = new URLSearchParams(window.location.search);
  for (const [key] of currentParams) {
    if (!PARAM_MAP.has(key)) {
      params.set(key, currentParams.get(key)!);
    }
  }

  const queryString = params.toString();
  const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
  const currentPath = window.location.pathname + (window.location.search ? window.location.search : '');

  if (currentPath !== newUrl) {
    window.history.pushState({ filters: true }, '', newUrl);
  }
}

/** Removes persisted filter state from localStorage. */
export function clearAllStorage() {
  storage.removeItem(STORAGE_KEY);
}
