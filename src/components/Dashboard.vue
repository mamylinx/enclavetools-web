<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import CardsContainer from './CardsContainer.vue';
import HomeContainer from './home/HomeContainer.vue';
import Sidebar from './Sidebar.vue';
import HorizontalFilterBar from './HorizontalFilterBar.vue';
import FilterBottomSheet from './FilterBottomSheet.vue';
import ActiveFiltersBar from './ActiveFiltersBar.vue';
import CompareTray from './CompareTray.vue';
import { useFilterState } from '../composables/useFilterState';
import type { Tool } from '../types';
import type { ToolWithCategory } from '../utils/toolModel';

const props = defineProps<{
    category: string;
    ssrTools?: Tool[];
    ssrTotal?: number;
    isHomepage?: boolean;
}>();

const {
    state: filterState,
    showModelFormat,
    activeCount,
    setFilter,
    toggleFilter,
    clearFilter,
    clearAll,
} = useFilterState();

const searchQuery = ref('');
const filterNew = ref(false);
const showFilterSheet = ref(false);
const hideCategory = computed(() => props.category !== 'all');

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
    <HorizontalFilterBar v-if="!isHomepage" class="hidden lg:block" :state="filterState" :show-model-format="showModelFormat"
        :active-count="activeCount" :hide-category="hideCategory" @update:sort="(v) => setFilter('sort', v)"
        @update:category="(v) => setFilter('category', v)" @update:use_case="(v) => setFilter('use_case', v)"
        @update:persona="(v) => setFilter('persona', v)"
        @update:setup_difficulty="(v) => setFilter('setup_difficulty', v)"
        @update:license="(v) => setFilter('license', v)" @update:language="(v) => setFilter('language', v)"
        @update:hardware="(v) => setFilter('hardware', v)" @update:deployment="(v) => setFilter('deployment', v)"
        @update:model_format="(v) => setFilter('model_format', v)"
        @update:maturity="(v) => setFilter('maturity', v)"
        @update:features="(v) => setFilter('features', v)"
        @update:commercial_use="(v) => setFilter('commercial_use', v)"
        @update:offline_after_setup="(v) => setFilter('offline_after_setup', v)"
        @update:telemetry="(v) => setFilter('telemetry', v)"
        @update:last_updated="(v) => setFilter('last_updated', v)" @toggle="handleToggle"
        @clear="(k) => clearFilter(k)" @clear-all="clearAll" />

    <div class="grid gap-8 max-w-[1400px] mx-auto px-4 md:px-8 pb-12 items-start"
        :class="[isHomepage ? 'pt-12' : 'pt-8 grid-cols-1 lg:grid-cols-[1fr_260px]']">

        <div class="flex flex-col gap-6 min-w-0">
            <div v-if="!isHomepage" class="lg:hidden mb-4">
                <button class="flex items-center justify-center gap-2 px-4 h-12 bg-white border border-brand-forest/10 font-extrabold text-brand-forest w-full hover:bg-brand-teal hover:text-white hover:border-brand-teal transition-colors rounded-full" @click="showFilterSheet = true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Filters
                    <span v-if="activeCount > 0" class="bg-brand-forest text-white px-2 py-1 rounded-full text-[10px] font-extrabold border border-brand-forest/10 ml-1">{{ activeCount }}</span>
                </button>
            </div>

            <ActiveFiltersBar v-if="!isHomepage" :state="filterState" :active-count="activeCount" @remove="handleRemoveChip"
                @clear-all="clearAll" />

            <HomeContainer v-if="isHomepage" :ssr-tools="props.ssrTools" />
            <CardsContainer v-else :filter="props.category" :search-query="searchQuery" :filter-new="filterNew"
                :filter-state="filterState" :ssr-tools="props.ssrTools" :ssr-total="props.ssrTotal"
                @clear-all="clearAll" />
        </div>

        <aside v-if="!isHomepage" class="sticky top-24 hidden lg:block w-full">
            <Sidebar showNewsletter />
        </aside>
        <CompareTray :tools="(props.ssrTools || []) as ToolWithCategory[]" />
    </div>

    <FilterBottomSheet v-if="showFilterSheet && !isHomepage" :state="filterState" :show-model-format="showModelFormat"
        :active-count="activeCount" :hide-category="hideCategory" @close="showFilterSheet = false" @update:sort="(v) => setFilter('sort', v)"
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
