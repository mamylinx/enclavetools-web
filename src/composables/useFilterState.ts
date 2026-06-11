import { reactive, computed, watch, onMounted } from 'vue';
import type { FilterState } from '../interfaces/tool';
import { MODEL_FORMAT_CATEGORIES } from './filterConfig';
import {
  PARAM_MAP,
  ARRAY_GROUPS,
  createDefaultState,
  loadFromStorage,
  saveToStorage,
  parseFromUrl,
  syncToUrl,
  hasActiveFilters,
  clearAllStorage,
} from './filterSerializer';
import { getActiveFiltersForDisplay } from './filterDisplay';
import { toApiParams } from './filterApiParams';
import { useActiveFilterCount } from './filterCounter';

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
    if (ARRAY_GROUPS.includes(key)) {
      (state[key] as string[]) = [];
    } else if (key === 'sort') {
      state.sort = 'featured';
    } else if (key === 'commercial_use') {
      state.commercial_use = null;
    } else if (key === 'offline_after_setup') {
      state.offline_after_setup = null;
    } else if (key === 'telemetry') {
      state.telemetry = null;
    } else if (key === 'last_updated') {
      state.last_updated = null;
    }
  }

  function clearAll() {
    state.sort = 'featured';
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
        if (!Object.keys(PARAM_MAP).includes(key)) continue;
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
