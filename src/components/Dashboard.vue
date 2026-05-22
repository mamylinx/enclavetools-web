<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import CardsContainer from './CardsContainer.vue';
import Sidebar from './Sidebar.vue';
import FilterSidebar from './FilterSidebar.vue';
import FilterBottomSheet from './FilterBottomSheet.vue';
import ActiveFiltersBar from './ActiveFiltersBar.vue';
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
    <div class="page-layout">
        <FilterSidebar class="filter-sidebar desktop-only" :state="filterState" :show-model-format="showModelFormat"
            :active-count="activeCount" @update:sort="(v) => setFilter('sort', v)"
            @update:category="(v) => setFilter('category', v)" @update:license="(v) => setFilter('license', v)"
            @update:language="(v) => setFilter('language', v)" @update:hardware="(v) => setFilter('hardware', v)"
            @update:deployment="(v) => setFilter('deployment', v)"
            @update:model_format="(v) => setFilter('model_format', v)"
            @update:maturity="(v) => setFilter('maturity', v)"
            @update:last_updated="(v) => setFilter('last_updated', v)" @toggle="handleToggle"
            @clear="(k) => clearFilter(k)" @clear-all="clearAll" />

        <div class="cards-container">
            <div class="mobile-filter-bar">
                <button class="mobile-filter-trigger" @click="showFilterSheet = true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Filters
                    <span v-if="activeCount > 0" class="mobile-filter-badge">{{ activeCount }}</span>
                </button>
            </div>

            <ActiveFiltersBar :state="filterState" :active-count="activeCount" @remove="handleRemoveChip"
                @clear-all="clearAll" />

            <CardsContainer :filter="props.category" :search-query="searchQuery" :filter-new="filterNew"
                :filter-state="filterState" :ssr-tools="props.ssrTools" :ssr-total="props.ssrTotal"
                @clear-all="clearAll" />
        </div>

        <aside class="sidebar desktop-only">
            <Sidebar showSponsor showNewsletter />
        </aside>
    </div>

    <FilterBottomSheet v-if="showFilterSheet" :state="filterState" :show-model-format="showModelFormat"
        :active-count="activeCount" @close="showFilterSheet = false" @update:sort="(v) => setFilter('sort', v)"
        @update:category="(v) => setFilter('category', v)" @update:license="(v) => setFilter('license', v)"
        @update:language="(v) => setFilter('language', v)" @update:hardware="(v) => setFilter('hardware', v)"
        @update:deployment="(v) => setFilter('deployment', v)"
        @update:model_format="(v) => setFilter('model_format', v)" @update:maturity="(v) => setFilter('maturity', v)"
        @update:last_updated="(v) => setFilter('last_updated', v)" @toggle="handleToggle" @clear="(k) => clearFilter(k)"
        @clear-all="clearAll" />
</template>
