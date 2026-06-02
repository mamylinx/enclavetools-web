<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import Card from './Card.vue';
import EmptyState from './EmptyState.vue';
import promotedData from '../data/promoted.json';
import sponsorsData from '../data/sponsors.json';
import featuredData from '../data/featured.json';
import newsletterData from '../data/newsletter.json';
import { randomSidebarPositions } from '../utils/randomSidebarPositions';
import type { Tool, Category, PromotedAd, Sponsor, FeaturedConfig, NewsletterData, FilterState } from '../types';
import { toolComparators, type SortKey } from '../utils/sorting';
import { isRecentlyAdded } from '../utils/dates';
import { enrichTool, type ToolWithCategory } from '../utils/toolModel';

const promotedAds = ref<PromotedAd[]>(promotedData.ads);
const sponsors = ref<Sponsor[]>(sponsorsData.sponsors);
const featured = ref<FeaturedConfig>(featuredData);
const newsletter = ref<NewsletterData>(newsletterData);

const ITEMS_PER_PAGE = 32;

const props = defineProps<{
    filter: string;
    sort?: SortKey;
    randomSeed?: number;
    searchQuery?: string;
    filterNew?: boolean;
    filterState?: FilterState;
    ssrTools?: ToolWithCategory[];
    ssrTotal?: number;
}>();

const emit = defineEmits<{
    'clear-all': [];
}>();

const displayedCount = ref(ITEMS_PER_PAGE);
const isLoading = ref(false);
const loaderRef = ref<HTMLElement | null>(null);
const activeSort = ref<string>('featured');

const baseTools = computed((): ToolWithCategory[] => {
    if (props.ssrTools && props.ssrTools.length > 0) {
        return props.ssrTools.map(enrichTool);
    }
    return [];
});

const hasActiveFilters = computed(() => {
    if (!props.filterState) return false;
    return (
        props.filterState.sort !== 'featured' ||
        props.filterState.category.length > 0 ||
        props.filterState.use_case.length > 0 ||
        props.filterState.persona.length > 0 ||
        props.filterState.setup_difficulty.length > 0 ||
        props.filterState.license.length > 0 ||
        props.filterState.language.length > 0 ||
        props.filterState.hardware.length > 0 ||
        props.filterState.deployment.length > 0 ||
        props.filterState.model_format.length > 0 ||
        props.filterState.maturity.length > 0 ||
        props.filterState.features.length > 0 ||
        props.filterState.commercial_use !== null ||
        props.filterState.offline_after_setup !== null ||
        props.filterState.telemetry !== null ||
        props.filterState.last_updated !== null
    );
});

function matchesFilter(tool: ToolWithCategory, filterState: FilterState): boolean {
    if (filterState.category.length > 0) {
        const toolCats = Array.isArray(tool.category) ? tool.category : [tool.category];
        if (!filterState.category.some(c => toolCats.includes(c))) return false;
    }
    if (filterState.use_case.length > 0) {
        const useCases = tool.use_cases || [];
        if (!filterState.use_case.some(u => useCases.includes(u))) return false;
    }
    if (filterState.persona.length > 0) {
        const personas = tool.personas || [];
        if (!filterState.persona.some(p => personas.includes(p))) return false;
    }
    if (filterState.setup_difficulty.length > 0 && !filterState.setup_difficulty.includes(tool.setup_difficulty || '')) return false;
    if (filterState.license.length > 0 && !filterState.license.includes(tool.license || '')) return false;
    if (filterState.language.length > 0) {
        const toolLangs = tool.language || [];
        if (!filterState.language.some(l => toolLangs.includes(l))) return false;
    }
    if (filterState.hardware.length > 0) {
        const toolHw = tool.hardware || [];
        if (!filterState.hardware.some(h => toolHw.includes(h))) return false;
    }
    if (filterState.deployment.length > 0) {
        const toolDeploy = tool.deployment || [];
        if (!filterState.deployment.some(d => toolDeploy.includes(d))) return false;
    }
    if (filterState.model_format.length > 0) {
        const toolFormats = tool.model_format || [];
        if (!filterState.model_format.some(f => toolFormats.includes(f))) return false;
    }
    if (filterState.maturity.length > 0 && !filterState.maturity.includes(tool.maturity || '')) return false;
    if (filterState.features.length > 0) {
        if (!filterState.features.every((feature) => Boolean((tool as Record<string, unknown>)[feature]))) return false;
    }
    if (filterState.commercial_use === 'yes' && !tool.commercial_use) return false;
    if (filterState.offline_after_setup === 'yes' && !tool.offline_after_setup) return false;
    if (filterState.telemetry === 'None' && tool.telemetry !== 'None') return false;
    if (filterState.last_updated) {
        const lastUpdated = tool.last_updated || tool['date-added'];
        if (!lastUpdated) return false;
        const now = new Date();
        const updated = new Date(lastUpdated);
        const daysDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
        if (filterState.last_updated === '30d' && daysDiff > 30) return false;
        if (filterState.last_updated === '6m' && daysDiff > 180) return false;
        if (filterState.last_updated === '1y' && daysDiff > 365) return false;
    }
    return true;
}

const filteredCards = computed((): ToolWithCategory[] => {
    let base = baseTools.value;

    if (props.filter !== 'all') {
        base = base.filter((tool) => {
            const cats = Array.isArray(tool.category) ? tool.category : [tool.category];
            return cats.includes(props.filter);
        });
    }

    if (props.filterNew) {
        base = base.filter((tool) => isRecentlyAdded(tool['date-added'], 30));
    }

    if (hasActiveFilters.value && props.filterState) {
        base = base.filter((tool) => matchesFilter(tool, props.filterState!));
    }

    const comparator = toolComparators[activeSort.value as keyof typeof toolComparators];
    if (comparator) base = [...base].sort(comparator);

    return base;
});

const displayedCards = computed(() => filteredCards.value.slice(0, displayedCount.value));

const toolCount = computed(() => filteredCards.value.length);

const isSearchingInCategory = computed(
    () => props.searchQuery && props.searchQuery.length >= 2 && props.filter !== 'all'
);

const hasNoSearchResults = computed(
    () => isSearchingInCategory.value && filteredCards.value.length === 0
);

const hasNoFilterResults = computed(
    () => hasActiveFilters.value && filteredCards.value.length === 0
);

const positions = randomSidebarPositions(computed(() => displayedCards.value.length));

watch(
    [() => props.filter, () => props.searchQuery, () => props.filterNew],
    () => {
        displayedCount.value = ITEMS_PER_PAGE;
    }
);

watch(
    () => props.filterState,
    () => {
        displayedCount.value = ITEMS_PER_PAGE;
        if (props.filterState?.sort) activeSort.value = props.filterState.sort;
    },
    { deep: true }
);

const tryRestore = () => {
    try {
        const raw = sessionStorage.getItem('toolsState');
        if (!raw) return;
        const state = JSON.parse(raw);
        if (state && state.filter === props.filter) {
            if (state.displayedCount && state.displayedCount > displayedCount.value) {
                displayedCount.value = state.displayedCount;
            }
            setTimeout(() => {
                if (typeof window !== 'undefined' && typeof state.scrollY !== 'undefined') {
                    window.scrollTo(0, state.scrollY);
                }
            }, 50);
        }
        sessionStorage.removeItem('toolsState');
    } catch (err) { }
};

const handleSaveState = () => {
    try {
        const state = {
            filter: props.filter,
            displayedCount: displayedCount.value,
            scrollY: typeof window !== 'undefined' ? window.scrollY || window.pageYOffset : 0,
        };
        sessionStorage.setItem('toolsState', JSON.stringify(state));
    } catch (err) { }
};

const setSort = (sort: string) => {
    activeSort.value = sort;
    if (props.filterState) props.filterState.sort = sort;
};

let observer: IntersectionObserver | null = null;

onMounted(() => {
    tryRestore();
    window.addEventListener('pageshow', tryRestore);
    window.addEventListener('astro:page-load', tryRestore);
    window.addEventListener('tools:save-state', handleSaveState);

    if (loaderRef.value) {
        observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0]?.isIntersecting &&
                    !isLoading.value &&
                    displayedCount.value < filteredCards.value.length
                ) {
                    isLoading.value = true;
                    setTimeout(() => {
                        displayedCount.value = Math.min(
                            displayedCount.value + ITEMS_PER_PAGE,
                            filteredCards.value.length
                        );
                        isLoading.value = false;
                    }, 300);
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(loaderRef.value);
    }
});

onUnmounted(() => {
    window.removeEventListener('pageshow', tryRestore);
    window.removeEventListener('astro:page-load', tryRestore);
    window.removeEventListener('tools:save-state', handleSaveState);
    if (observer) observer.disconnect();
});
</script>

<template>
    <div v-if="hasNoFilterResults">
        <EmptyState icon="filter" :message="'No tools match your filters.'" action-text="Clear all filters"
            @action="emit('clear-all')" />
    </div>

    <div v-else-if="hasNoSearchResults">
        <EmptyState icon="search" :message="`No results found for &quot;${searchQuery}&quot; in this category.`"
            action-text="Search All Tools" action-href="/" />
    </div>

    <div v-else>
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-900 gap-4 mb-6">
            <span class="text-xs font-extrabold text-gray-500 uppercase tracking-widest">
                <span>{{ toolCount }} result{{ toolCount !== 1 ? 's' : '' }}</span>
            </span>
            <div class="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <button class="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors border" :class="{ 'bg-gray-100 text-gray-900 border-gray-200': activeSort === 'az', 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50': activeSort !== 'az' }" @click="setSort('az')">A–Z</button>
                <button class="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors border" :class="{ 'bg-gray-100 text-gray-900 border-gray-200': activeSort === 'featured', 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50': activeSort !== 'featured' }"
                    @click="setSort('featured')">Featured</button>
                <button class="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors border" :class="{ 'bg-gray-100 text-gray-900 border-gray-200': activeSort === 'newest', 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50': activeSort !== 'newest' }"
                    @click="setSort('newest')">Recently added</button>
                <button class="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors border" :class="{ 'bg-gray-100 text-gray-900 border-gray-200': activeSort === 'recently-updated', 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50': activeSort !== 'recently-updated' }"
                    @click="setSort('recently-updated')">Last updated</button>
                <button class="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors border" :class="{ 'bg-gray-100 text-gray-900 border-gray-200': activeSort === 'most-popular', 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50': activeSort !== 'most-popular' }"
                    @click="setSort('most-popular')">Most stars</button>
            </div>
        </div>

        <ul role="list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 m-0 p-0">
            <template v-for="(item, i) in displayedCards" :key="`${item.title}-${i}`">
                <div class="col-span-1 md:col-span-2 flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-2 border-gray-900 bg-gray-100 mb-2" v-if="i === 0" v-for="ad in promotedAds" :key="ad.title">
                    <div class="flex-1">
                        <div class="text-[10px] font-black uppercase text-gray-900 tracking-wider mb-2">{{ ad.label }}</div>
                        <div class="text-xl font-black text-gray-900 mb-1">{{ ad.title }}</div>
                        <p class="text-sm font-medium text-gray-600 m-0">{{ ad.description }}</p>
                    </div>
                    <button class="mt-4 md:mt-0 whitespace-nowrap px-6 py-2.5 bg-gray-900 hover:bg-yellow-400 hover:text-gray-900 text-white font-bold transition-colors">{{ ad.cta }}</button>
                </div>

                <div class="lg:hidden col-span-1 border border-gray-200 p-5 bg-white" v-if="i === positions.sponsor" v-for="sponsor in sponsors"
                    :key="'sponsor-' + sponsor.logo">
                    <div class="flex flex-col h-full">
                        <div class="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">Sponsor</div>
                        <div class="text-xl font-black text-gray-900 mb-2">{{ sponsor.logo }}</div>
                        <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ sponsor.description }}</p>
                        <button class="w-full py-2 border border-gray-200 font-bold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors">{{ sponsor.cta }}</button>
                    </div>
                </div>

                <div class="lg:hidden col-span-1 border border-gray-200 p-5 bg-white" v-if="i === positions.newsletter">
                    <div class="flex flex-col h-full">
                        <div class="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">Newsletter</div>
                        <div class="text-lg font-black text-gray-900 mb-2">{{ newsletter.title }}</div>
                        <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ newsletter.subtitle }}</p>
                        <input class="w-full px-3 py-2 border border-gray-200 font-sans text-sm mb-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none" type="email" :placeholder="newsletter.placeholder" />
                        <button class="w-full py-2 bg-gray-900 text-white font-bold hover:bg-yellow-400 hover:text-gray-900 transition-colors">Get the digest</button>
                    </div>
                </div>

                <div class="lg:hidden col-span-1 border border-gray-200 p-5 bg-white" v-if="i === positions.featured">
                    <div class="flex flex-col h-full">
                        <div class="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">Get featured</div>
                        <div class="text-lg font-black text-gray-900 mb-2">{{ featured.title }}</div>
                        <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ featured.description }}</p>
                        <button class="w-full py-2 bg-gray-900 text-white font-bold hover:bg-yellow-400 hover:text-gray-900 transition-colors">{{ featured.cta }}</button>
                    </div>
                </div>

                <Card :href="item.url" :title="item.title" :body="item.body" :license="item.license"
                    :date-added="item['date-added']" :slug="item.slug" :featured="item.featured"
                    :github-stars="item.popularity_score" :last-updated="item.last_updated"
                    :setup-difficulty="item.setup_difficulty" :features="item.features"
                    :hardware="item.hardware" :commercial-use="item.commercial_use"
                    :category="Array.isArray(item.category) ? item.category[0] : item.category" />
            </template>
        </ul>

        <div v-if="displayedCount < filteredCards.length" ref="loaderRef" class="py-8 text-center">
            <p v-if="isLoading" class="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading more...</p>
        </div>
    </div>
</template>

<script lang="ts">
import { h } from 'vue';
</script>
