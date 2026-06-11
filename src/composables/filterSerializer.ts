import type { FilterState } from '../interfaces/tool';
import { localStorageAdapter as storage } from '../lib/storage';

export const PARAM_MAP: Record<string, keyof FilterState> = {
  sort: 'sort',
  cat: 'category',
  use: 'use_case',
  persona: 'persona',
  setup: 'setup_difficulty',
  license: 'license',
  lang: 'language',
  hw: 'hardware',
  deploy: 'deployment',
  format: 'model_format',
  mat: 'maturity',
  feature: 'features',
  commercial: 'commercial_use',
  offline: 'offline_after_setup',
  telemetry: 'telemetry',
  updated: 'last_updated',
};

export const ARRAY_GROUPS: (keyof FilterState)[] = [
  'category', 'use_case', 'persona', 'setup_difficulty',
  'license', 'language', 'hardware', 'deployment',
  'model_format', 'maturity', 'features',
];

const STORAGE_KEY = 'enclavetools-filters';

export function createDefaultState(): FilterState {
  return {
    sort: 'featured',
    category: [],
    use_case: [],
    persona: [],
    setup_difficulty: [],
    license: [],
    language: [],
    hardware: [],
    deployment: [],
    model_format: [],
    maturity: [],
    features: [],
    commercial_use: null,
    offline_after_setup: null,
    telemetry: null,
    last_updated: null,
  };
}

export function loadFromStorage(): FilterState | null {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

export function saveToStorage(state: FilterState) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function parseFromUrl(): FilterState {
  const state = createDefaultState();
  const params = new URLSearchParams(window.location.search);

  for (const [param, key] of Object.entries(PARAM_MAP)) {
    const values = params.getAll(param);
    if (values.length === 0) continue;

    if (ARRAY_GROUPS.includes(key as keyof FilterState)) {
      (state[key] as string[]) = values;
    } else if (key === 'sort') {
      state.sort = values[0];
    } else if (key === 'commercial_use') {
      state.commercial_use = values[0] || null;
    } else if (key === 'offline_after_setup') {
      state.offline_after_setup = values[0] || null;
    } else if (key === 'telemetry') {
      state.telemetry = values[0] || null;
    } else if (key === 'last_updated') {
      state.last_updated = values[0] || null;
    }
  }

  return state;
}

export function syncToUrl(state: FilterState) {
  const params = new URLSearchParams();

  for (const [param, key] of Object.entries(PARAM_MAP)) {
    const value = state[key as keyof FilterState];

    if (ARRAY_GROUPS.includes(key as keyof FilterState)) {
      const arr = value as string[];
      arr.forEach((v) => params.append(param, v));
    } else if (key === 'sort' && value !== 'featured') {
      params.set(param, value as string);
    } else if ((key === 'commercial_use' || key === 'offline_after_setup' || key === 'telemetry') && value) {
      params.set(param, value as string);
    } else if (key === 'last_updated' && value) {
      params.set(param, value as string);
    }
  }

  const currentParams = new URLSearchParams(window.location.search);
  for (const [key] of currentParams) {
    if (!Object.keys(PARAM_MAP).includes(key)) {
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

export function hasActiveFilters(state: FilterState): boolean {
  return state.sort !== 'featured' ||
    state.category.length > 0 ||
    state.use_case.length > 0 ||
    state.persona.length > 0 ||
    state.setup_difficulty.length > 0 ||
    state.license.length > 0 ||
    state.language.length > 0 ||
    state.hardware.length > 0 ||
    state.deployment.length > 0 ||
    state.model_format.length > 0 ||
    state.maturity.length > 0 ||
    state.features.length > 0 ||
    state.commercial_use !== null ||
    state.offline_after_setup !== null ||
    state.telemetry !== null ||
    state.last_updated !== null;
}

export function clearAllStorage() {
  storage.removeItem(STORAGE_KEY);
}
