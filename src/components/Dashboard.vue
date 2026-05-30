<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import CardsContainer from './CardsContainer.vue';
import Sidebar from './Sidebar.vue';
import FilterSidebar from './FilterSidebar.vue';
import FilterBottomSheet from './FilterBottomSheet.vue';
import ActiveFiltersBar from './ActiveFiltersBar.vue';
import CompareTray from './CompareTray.vue';
import { useFilterState } from '../composables/useFilterState';
import type { Tool } from '../types';

const props = defineProps<{
    category: string;
    ssrTools?: Tool[];
    ssrTotal?: number;
}>();

const {
    state: filterState,
    showModelFormat,
    activeCount,
    hasActiveFilters,
    setFilter,
    toggleFilter,
    clearFilter,
    clearAll,
} = useFilterState();

const searchQuery = ref('');
const filterNew = ref(false);
const showFilterSheet = ref(false);

const handleSearch = (e: Event) => {
    const detail = (e as CustomEvent<{ query?: string }>)?.detail || {};
    if (typeof detail.query !== 'undefined') {
        searchQuery.value = detail.query;
    }
};

const handleFilterNew = (e: Event) => {
    const detail = (e as CustomEvent<{ filterNew?: boolean }>)?.detail || {};
    if (typeof detail.filterNew !== 'undefined') {
        filterNew.value = detail.filterNew;
    }
};

function handleToggle(key: keyof typeof filterState, value: string) {
    toggleFilter(key, value);
}

function handleRemoveChip(key: keyof typeof filterState, value: string) {
    const arr = filterState[key] as string[];
    if (Array.isArray(arr)) {
        const idx = arr.indexOf(value);
        if (idx !== -1) arr.splice(idx, 1);
    } else if (key === 'sort') {
        filterState.sort = 'featured';
    } else if (key === 'commercial_use') {
        filterState.commercial_use = null;
    } else if (key === 'offline_after_setup') {
        filterState.offline_after_setup = null;
    } else if (key === 'telemetry') {
        filterState.telemetry = null;
    } else if (key === 'last_updated') {
        filterState.last_updated = null;
    }
}

onMounted(() => {
    if (typeof window !== 'undefined') {
        window.addEventListener('tools:search', handleSearch);
        window.addEventListener('tools:filter-new', handleFilterNew);
    }
});

onUnmounted(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('tools:search', handleSearch);
        window.removeEventListener('tools:filter-new', handleFilterNew);
    }
});
</script>

<template>
    <div class="grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] gap-8 max-w-[1400px] mx-auto px-4 md:px-10 py-8 items-start">
        <FilterSidebar class="hidden lg:block" :state="filterState" :show-model-format="showModelFormat"
            :active-count="activeCount" @update:sort="(v) => setFilter('sort', v)"
            @update:category="(v) => setFilter('category', v)" @update:license="(v) => setFilter('license', v)"
            @update:use_case="(v) => setFilter('use_case', v)" @update:persona="(v) => setFilter('persona', v)"
            @update:setup_difficulty="(v) => setFilter('setup_difficulty', v)"
            @update:language="(v) => setFilter('language', v)" @update:hardware="(v) => setFilter('hardware', v)"
            @update:deployment="(v) => setFilter('deployment', v)"
            @update:model_format="(v) => setFilter('model_format', v)"
            @update:maturity="(v) => setFilter('maturity', v)"
            @update:features="(v) => setFilter('features', v)"
            @update:commercial_use="(v) => setFilter('commercial_use', v)"
            @update:offline_after_setup="(v) => setFilter('offline_after_setup', v)"
            @update:telemetry="(v) => setFilter('telemetry', v)"
            @update:last_updated="(v) => setFilter('last_updated', v)" @toggle="handleToggle"
            @clear="(k) => clearFilter(k)" @clear-all="clearAll" />

        <div class="flex flex-col gap-6 min-w-0">
            <div class="lg:hidden mb-4">
                <button class="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-900 font-extrabold text-gray-900 w-full hover:bg-gray-50 transition-colors" @click="showFilterSheet = true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Filters
                    <span v-if="activeCount > 0" class="bg-primary-500 text-white px-2 py-0.5 rounded-full text-[10px] ml-1">{{ activeCount }}</span>
                </button>
            </div>

            <ActiveFiltersBar :state="filterState" :active-count="activeCount" @remove="handleRemoveChip"
                @clear-all="clearAll" />

            <CardsContainer :filter="props.category" :search-query="searchQuery" :filter-new="filterNew"
                :filter-state="filterState" :ssr-tools="props.ssrTools" :ssr-total="props.ssrTotal"
                @clear-all="clearAll" />
        </div>

        <aside class="hidden lg:block w-full">
            <Sidebar showSponsor showNewsletter />
        </aside>
        <CompareTray :tools="props.ssrTools || []" />
    </div>

    <FilterBottomSheet v-if="showFilterSheet" :state="filterState" :show-model-format="showModelFormat"
        :active-count="activeCount" @close="showFilterSheet = false" @update:sort="(v) => setFilter('sort', v)"
        @update:category="(v) => setFilter('category', v)" @update:license="(v) => setFilter('license', v)"
        @update:use_case="(v) => setFilter('use_case', v)" @update:persona="(v) => setFilter('persona', v)"
        @update:setup_difficulty="(v) => setFilter('setup_difficulty', v)"
        @update:language="(v) => setFilter('language', v)" @update:hardware="(v) => setFilter('hardware', v)"
        @update:deployment="(v) => setFilter('deployment', v)"
        @update:model_format="(v) => setFilter('model_format', v)" @update:maturity="(v) => setFilter('maturity', v)"
        @update:features="(v) => setFilter('features', v)"
        @update:commercial_use="(v) => setFilter('commercial_use', v)"
        @update:offline_after_setup="(v) => setFilter('offline_after_setup', v)"
        @update:telemetry="(v) => setFilter('telemetry', v)"
        @update:last_updated="(v) => setFilter('last_updated', v)" @toggle="handleToggle" @clear="(k) => clearFilter(k)"
        @clear-all="clearAll" />
</template>
