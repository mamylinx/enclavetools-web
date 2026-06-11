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

  const activeCount = computed(() => {
    let count = 0;
    if (state.sort !== 'featured') count++;
    count += state.category.length;
    count += state.use_case.length;
    count += state.persona.length;
    count += state.setup_difficulty.length;
    count += state.license.length;
    count += state.language.length;
    count += state.hardware.length;
    count += state.deployment.length;
    count += state.model_format.length;
    count += state.maturity.length;
    count += state.features.length;
    if (state.commercial_use) count++;
    if (state.offline_after_setup) count++;
    if (state.telemetry) count++;
    if (state.last_updated) count++;
    return count;
  });

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

  function getActiveFiltersForDisplay(): Array<{ group: string; label: string; value: string }> {
    const result: Array<{ group: string; label: string; value: string }> = [];

    if (state.sort !== 'featured') {
      result.push({ group: 'Sort', label: 'Sort', value: state.sort });
    }
    state.category.forEach((v) => result.push({ group: 'Category', label: 'Category', value: v }));
    state.use_case.forEach((v) => result.push({ group: 'Use Case', label: 'Use Case', value: v }));
    state.persona.forEach((v) => result.push({ group: 'Persona', label: 'Persona', value: v }));
    state.setup_difficulty.forEach((v) => result.push({ group: 'Setup', label: 'Setup', value: v }));
    state.license.forEach((v) => result.push({ group: 'License', label: 'License', value: v }));
    state.language.forEach((v) => result.push({ group: 'Language', label: 'Language', value: v }));
    state.hardware.forEach((v) => result.push({ group: 'Hardware', label: 'Hardware', value: v }));
    state.deployment.forEach((v) => result.push({ group: 'Deployment', label: 'Deployment', value: v }));
    state.model_format.forEach((v) => result.push({ group: 'Model Format', label: 'Model Format', value: v }));
    state.maturity.forEach((v) => result.push({ group: 'Maturity', label: 'Maturity', value: v }));
    state.features.forEach((v) => result.push({ group: 'Feature', label: 'Feature', value: v }));
    if (state.commercial_use) result.push({ group: 'Commercial Use', label: 'Commercial Use', value: state.commercial_use });
    if (state.offline_after_setup) result.push({ group: 'Offline', label: 'Offline', value: state.offline_after_setup });
    if (state.telemetry) result.push({ group: 'Telemetry', label: 'Telemetry', value: state.telemetry });
    if (state.last_updated) {
      result.push({ group: 'Last Updated', label: 'Last Updated', value: state.last_updated });
    }

    return result;
  }

  function toApiParams(): URLSearchParams {
    const params = new URLSearchParams();
    if (state.sort !== 'featured') params.set('sort', state.sort);
    state.category.forEach((v) => params.append('cat', v));
    state.use_case.forEach((v) => params.append('use', v));
    state.persona.forEach((v) => params.append('persona', v));
    state.setup_difficulty.forEach((v) => params.append('setup', v));
    state.license.forEach((v) => params.append('license', v));
    state.language.forEach((v) => params.append('lang', v));
    state.hardware.forEach((v) => params.append('hw', v));
    state.deployment.forEach((v) => params.append('deploy', v));
    state.model_format.forEach((v) => params.append('format', v));
    state.maturity.forEach((v) => params.append('mat', v));
    state.features.forEach((v) => params.append('feature', v));
    if (state.commercial_use) params.set('commercial', state.commercial_use);
    if (state.offline_after_setup) params.set('offline', state.offline_after_setup);
    if (state.telemetry) params.set('telemetry', state.telemetry);
    if (state.last_updated) params.set('updated', state.last_updated);
    return params;
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
    getActiveFiltersForDisplay,
    toApiParams,
  };
}
