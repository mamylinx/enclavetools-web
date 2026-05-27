<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import Fuse from 'fuse.js';
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

const fuseOptions = {
    keys: [
        { name: 'title', weight: 0.4 },
        { name: 'body', weight: 0.3 },
        { name: 'plain_description', weight: 0.25 },
        { name: 'technical_description', weight: 0.2 },
        { name: 'category', weight: 0.2 },
        { name: 'use_cases', weight: 0.15 },
        { name: 'personas', weight: 0.15 },
        { name: 'features', weight: 0.15 },
        { name: 'tag', weight: 0.1 },
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
};

const baseTools = computed((): ToolWithCategory[] => {
    if (props.ssrTools && props.ssrTools.length > 0) {
        return props.ssrTools.map(enrichTool);
    }
    return [];
});

const fuse = computed(() => new Fuse(baseTools.value, fuseOptions));

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

    if (props.searchQuery && props.searchQuery.length >= 2) {
        const results = fuse.value.search(props.searchQuery);
        const searchResults = new Set(results.map((r) => r.item.slug || r.item.title));
        base = base.filter((tool) => searchResults.has(tool.slug || tool.title));
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
        <div class="toolbar">
            <span class="toolbar-count">
                <span>{{ toolCount }} result{{ toolCount !== 1 ? 's' : '' }}</span>
            </span>
            <div class="toolbar-sorts">
                <button class="sort-btn" :class="{ active: activeSort === 'az' }" @click="setSort('az')">A–Z</button>
                <button class="sort-btn" :class="{ active: activeSort === 'featured' }"
                    @click="setSort('featured')">Featured</button>
                <button class="sort-btn" :class="{ active: activeSort === 'newest' }"
                    @click="setSort('newest')">Recently added</button>
                <button class="sort-btn" :class="{ active: activeSort === 'recently-updated' }"
                    @click="setSort('recently-updated')">Last updated</button>
                <button class="sort-btn" :class="{ active: activeSort === 'most-popular' }"
                    @click="setSort('most-popular')">Most stars</button>
            </div>
        </div>

        <ul role="list" class="link-card-grid">
            <template v-for="(item, i) in displayedCards" :key="`${item.title}-${i}`">
                <div class="ad-card" v-if="i === 0" v-for="ad in promotedAds" :key="ad.title">
                    <div class="ad-left">
                        <div class="ad-label">{{ ad.label }}</div>
                        <div class="ad-title">{{ ad.title }}</div>
                        <p class="ad-sub">{{ ad.description }}</p>
                    </div>
                    <button class="ad-btn">{{ ad.cta }}</button>
                </div>

                <div class="mobile-sidebar-card" v-if="i === positions.sponsor" v-for="sponsor in sponsors"
                    :key="'sponsor-' + sponsor.logo">
                    <div class="scard">
                        <div class="scard-label">Sponsor</div>
                        <div class="sponsor-logo">{{ sponsor.logo }}</div>
                        <p class="sponsor-desc">{{ sponsor.description }}</p>
                        <button class="scard-btn-ghost">{{ sponsor.cta }}</button>
                    </div>
                </div>

                <div class="mobile-sidebar-card" v-if="i === positions.newsletter">
                    <div class="scard">
                        <div class="scard-label">Newsletter</div>
                        <div class="scard-title">{{ newsletter.title }}</div>
                        <p class="scard-sub">{{ newsletter.subtitle }}</p>
                        <input class="scard-input" type="email" :placeholder="newsletter.placeholder" />
                        <button class="scard-btn">Get the digest</button>
                    </div>
                </div>

                <div class="mobile-sidebar-card" v-if="i === positions.featured">
                    <div class="scard">
                        <div class="scard-label">Get featured</div>
                        <div class="scard-title">{{ featured.title }}</div>
                        <p class="scard-sub">{{ featured.description }}</p>
                        <button class="scard-btn">{{ featured.cta }}</button>
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

        <div v-if="displayedCount < filteredCards.length" ref="loaderRef" class="infinite-scroll-loader">
            <p v-if="isLoading" class="loading-text">Loading more...</p>
        </div>
    </div>
</template>

<script lang="ts">
import { h } from 'vue';
</script>
