import { reactive, computed, watch, onMounted } from 'vue';
import type { FilterState } from '../types';
import { MODEL_FORMAT_CATEGORIES } from './filterConfig';
import { PARAM_MAP, ARRAY_KEYS } from './filterDefinitions';
import {
  createDefaultState,
  loadFromStorage,
  saveToStorage,
  parseFromUrl,
  syncToUrl,
  hasActiveFilters,
  clearAllStorage,
} from './filterSerializer';
import { getActiveFiltersForDisplay } from './filterDefinitions';
import { toApiParams } from './filterDefinitions';
import { useActiveFilterCount } from './filterCounter';

/** Composable that manages filter state, URL sync, localStorage persistence, and filter actions. */
export function useFilterState() {
  const state = reactive<FilterState>(createDefaultState());
  let hasLoadedFromStorage = false;

  onMounted(() => {
    if (hasLoadedFromStorage) return;
    hasLoadedFromStorage = true;

    const urlHasParams = new URLSearchParams(window.location.search).toString().length > 0;

    if (urlHasParams) {
      const urlState = parseFromUrl();
      Object.assign(state, urlState);
    } else {
      const stored = loadFromStorage();
      if (stored && hasActiveFilters(stored)) {
        Object.assign(state, stored);
        syncToUrl(state);
      }
    }
  });

  function isModelFormatVisible(s: FilterState): boolean {
    return s.category.some((c) => MODEL_FORMAT_CATEGORIES.includes(c));
  }

  const showModelFormat = computed(() => isModelFormatVisible(state));

  const activeCount = useActiveFilterCount(state);

  const hasActiveFiltersComputed = computed(() => activeCount.value > 0);

  function setFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    (state[key] as FilterState[K]) = value;

    if (key === 'category' && !isModelFormatVisible(state)) {
      state.model_format = [];
    }
  }

  function toggleFilter<K extends keyof FilterState>(key: K, value: string) {
    const arr = state[key] as string[];
    const idx = arr.indexOf(value);
    if (idx === -1) {
      arr.push(value);
    } else {
      arr.splice(idx, 1);
    }

    if (key === 'category' && !isModelFormatVisible(state)) {
      state.model_format = [];
    }
  }

  function clearFilter<K extends keyof FilterState>(key: K) {
    if (ARRAY_KEYS.has(key)) {
      (state[key] as string[]) = [];
    } else if (key === 'sort') {
      state.sort = 'newest';
    } else {
      (state[key] as string | null) = null;
    }
  }

  function clearAll() {
    state.sort = 'newest';
    state.category = [];
    state.use_case = [];
    state.persona = [];
    state.setup_difficulty = [];
    state.license = [];
    state.language = [];
    state.hardware = [];
    state.deployment = [];
    state.model_format = [];
    state.maturity = [];
    state.features = [];
    state.commercial_use = null;
    state.offline_after_setup = null;
    state.telemetry = null;
    state.last_updated = null;

    if (typeof window !== 'undefined') {
      clearAllStorage();
      const params = new URLSearchParams(window.location.search);
      for (const [key] of params) {
        if (!PARAM_MAP.has(key)) continue;
        params.delete(key);
      }
      const qs = params.toString();
      const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.pushState({ filters: true }, '', url);
    }
  }

  watch(
    state,
    () => {
      if (!hasLoadedFromStorage) return;
      syncToUrl(state);
      saveToStorage(state);
    },
    { deep: true, flush: 'post' }
  );

  return {
    state,
    showModelFormat,
    activeCount,
    hasActiveFilters: hasActiveFiltersComputed,
    setFilter,
    toggleFilter,
    clearFilter,
    clearAll,
    getActiveFiltersForDisplay: () => getActiveFiltersForDisplay(state),
    toApiParams: () => toApiParams(state),
  };
}
