import { reactive, computed, watch, onMounted } from 'vue';
import type { FilterState } from '../types';
import { MODEL_FORMAT_CATEGORIES } from './filterConfig';

const PARAM_MAP: Record<string, keyof FilterState> = {
    sort: 'sort',
    cat: 'category',
    license: 'license',
    lang: 'language',
    hw: 'hardware',
    deploy: 'deployment',
    format: 'model_format',
    mat: 'maturity',
    updated: 'last_updated',
};

const ARRAY_GROUPS: (keyof FilterState)[] = ['category', 'license', 'language', 'hardware', 'deployment', 'model_format', 'maturity'];

const STORAGE_KEY = 'enclavetools-filters';

function createDefaultState(): FilterState {
    return {
        sort: 'featured',
        category: [],
        license: [],
        language: [],
        hardware: [],
        deployment: [],
        model_format: [],
        maturity: [],
        last_updated: null,
    };
}

function loadFromStorage(): FilterState | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch { return null; }
}

function saveToStorage(state: FilterState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
}

function parseFromUrl(): FilterState {
    const state = createDefaultState();
    const params = new URLSearchParams(window.location.search);

    for (const [param, key] of Object.entries(PARAM_MAP)) {
        const values = params.getAll(param);
        if (values.length === 0) continue;

        if (ARRAY_GROUPS.includes(key as keyof FilterState)) {
            (state[key] as string[]) = values;
        } else if (key === 'sort') {
            state.sort = values[0];
        } else if (key === 'last_updated') {
            state.last_updated = values[0] || null;
        }
    }

    return state;
}

function syncToUrl(state: FilterState) {
    const params = new URLSearchParams();

    for (const [param, key] of Object.entries(PARAM_MAP)) {
        const value = state[key as keyof FilterState];

        if (ARRAY_GROUPS.includes(key as keyof FilterState)) {
            const arr = value as string[];
            arr.forEach((v) => params.append(param, v));
        } else if (key === 'sort' && value !== 'featured') {
            params.set(param, value as string);
        } else if (key === 'last_updated' && value) {
            params.set(param, value as string);
        }
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    const currentPath = window.location.pathname + (window.location.search ? window.location.search : '');

    if (currentPath !== newUrl) {
        window.history.pushState({ filters: true }, '', newUrl);
    }
}

function isModelFormatVisible(state: FilterState): boolean {
    return state.category.some((c) => MODEL_FORMAT_CATEGORIES.includes(c));
}

function hasActiveFilters(state: FilterState): boolean {
    return state.sort !== 'featured' ||
        state.category.length > 0 ||
        state.license.length > 0 ||
        state.language.length > 0 ||
        state.hardware.length > 0 ||
        state.deployment.length > 0 ||
        state.model_format.length > 0 ||
        state.maturity.length > 0 ||
        state.last_updated !== null;
}

export function useFilterState() {
    // Always start with default state
    const state = reactive<FilterState>(createDefaultState());
    let hasLoadedFromStorage = false;

    // Load from URL or localStorage after mount
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

    const showModelFormat = computed(() => isModelFormatVisible(state));

    const activeCount = computed(() => {
        let count = 0;
        if (state.sort !== 'featured') count++;
        count += state.category.length;
        count += state.license.length;
        count += state.language.length;
        count += state.hardware.length;
        count += state.deployment.length;
        count += state.model_format.length;
        count += state.maturity.length;
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
        } else if (key === 'last_updated') {
            state.last_updated = null;
        }
    }

    function clearAll() {
        state.sort = 'featured';
        state.category = [];
        state.license = [];
        state.language = [];
        state.hardware = [];
        state.deployment = [];
        state.model_format = [];
        state.maturity = [];
        state.last_updated = null;

        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
            window.history.pushState({ filters: true }, '', window.location.pathname);
        }
    }

    function getActiveFiltersForDisplay(): Array<{ group: string; label: string; value: string }> {
        const result: Array<{ group: string; label: string; value: string }> = [];

        if (state.sort !== 'featured') {
            result.push({ group: 'Sort', label: 'Sort', value: state.sort });
        }
        state.category.forEach((v) => result.push({ group: 'Category', label: 'Category', value: v }));
        state.license.forEach((v) => result.push({ group: 'License', label: 'License', value: v }));
        state.language.forEach((v) => result.push({ group: 'Language', label: 'Language', value: v }));
        state.hardware.forEach((v) => result.push({ group: 'Hardware', label: 'Hardware', value: v }));
        state.deployment.forEach((v) => result.push({ group: 'Deployment', label: 'Deployment', value: v }));
        state.model_format.forEach((v) => result.push({ group: 'Model Format', label: 'Model Format', value: v }));
        state.maturity.forEach((v) => result.push({ group: 'Maturity', label: 'Maturity', value: v }));
        if (state.last_updated) {
            result.push({ group: 'Last Updated', label: 'Last Updated', value: state.last_updated });
        }

        return result;
    }

    function toApiParams(): URLSearchParams {
        const params = new URLSearchParams();
        if (state.sort !== 'featured') params.set('sort', state.sort);
        state.category.forEach((v) => params.append('cat', v));
        state.license.forEach((v) => params.append('license', v));
        state.language.forEach((v) => params.append('lang', v));
        state.hardware.forEach((v) => params.append('hw', v));
        state.deployment.forEach((v) => params.append('deploy', v));
        state.model_format.forEach((v) => params.append('format', v));
        state.maturity.forEach((v) => params.append('mat', v));
        if (state.last_updated) params.set('updated', state.last_updated);
        return params;
    }

    watch(
        () => ({ ...state }),
        () => {
            if (!hasLoadedFromStorage) return;
            syncToUrl(state);
            saveToStorage(state);
        },
        { deep: true }
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
