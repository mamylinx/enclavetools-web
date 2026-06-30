<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Card from './Card.vue';
import EmptyState from './EmptyState.vue';
import marketingData from '../data/marketing.json';
import siteContent from '../data/site-content.json';
import { randomSidebarPositions } from '../utils/randomSidebarPositions';
import type { Tool, FilterState } from '../types';
import { toolComparators, type SortKey } from '../utils/sorting';
import { isRecentlyAdded } from '../utils/dates';
import type { ToolWithCategory } from '../utils/toolModel';
import { searchTools } from '../composables/useOrama';
import type { MarketingConfig } from '../interfaces/content';

const m = marketingData as MarketingConfig;
const c = siteContent as Record<string, string>;

const promotedAds = ref(m.promoted || []);
const sponsors = ref(m.sponsors || []);
const featured = ref(m.featured?.[0] || null);

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

const activeSort = ref<string>('featured');
const currentPage = ref(1);
const oramaResults = ref<ToolWithCategory[]>([]);
const oramaTotal = ref(0);

const baseTools = computed((): ToolWithCategory[] => {
    if (props.ssrTools && props.ssrTools.length > 0) {
        return props.ssrTools;
    }
    return [];
});

function hasActiveFilters(filterState: FilterState): boolean {
    return (
        filterState.sort !== 'featured' ||
        filterState.category.length > 0 ||
        filterState.use_case.length > 0 ||
        filterState.persona.length > 0 ||
        filterState.setup_difficulty.length > 0 ||
        filterState.license.length > 0 ||
        filterState.language.length > 0 ||
        filterState.hardware.length > 0 ||
        filterState.deployment.length > 0 ||
        filterState.model_format.length > 0 ||
        filterState.maturity.length > 0 ||
        filterState.features.length > 0 ||
        filterState.commercial_use !== null ||
        filterState.offline_after_setup !== null ||
        filterState.telemetry !== null ||
        filterState.last_updated !== null
    );
}

const isOramaActive = computed(() => {
    if (!props.filterState) return false;
    return hasActiveFilters(props.filterState) || (!!props.searchQuery && props.searchQuery.length >= 2);
});

const filteredCards = computed((): ToolWithCategory[] => {
    if (isOramaActive.value) {
        return oramaResults.value;
    }
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

    const comparator = toolComparators[activeSort.value as keyof typeof toolComparators];
    if (comparator) base = [...base].sort(comparator);

    return base;
});

const toolCount = computed(() => {
    if (isOramaActive.value) return oramaTotal.value;
    return filteredCards.value.length;
});

const totalPages = computed(() => Math.ceil(oramaTotal.value / 25));

const hasCategoryFilterActive = computed(() => {
    if (!props.filterState) return false;
    return props.filterState.category.length > 0;
});

const isSearchingInCategory = computed(
    () => props.searchQuery && props.searchQuery.length >= 2 && props.filter !== 'all'
);

const hasNoSearchResults = computed(
    () => isSearchingInCategory.value && filteredCards.value.length === 0
);

const hasNoFilterResults = computed(
    () => isOramaActive.value && filteredCards.value.length === 0
);

const positions = randomSidebarPositions(computed(() => filteredCards.value.length));

const setSort = (sort: string) => {
    activeSort.value = sort;
    if (props.filterState) props.filterState.sort = sort;
};

const goToPage = (page: number) => {
    currentPage.value = page;
};

async function runOramaSearch() {
    if (!props.filterState) return;
    const isActive = hasActiveFilters(props.filterState) || (!!props.searchQuery && props.searchQuery.length >= 2);
    if (!isActive) {
        oramaResults.value = [];
        oramaTotal.value = 0;
        return;
    }
    try {
        const result = await searchTools({
            urlCategory: props.filter,
            filters: props.filterState,
            term: props.searchQuery,
            sort: activeSort.value,
            limit: 25,
            offset: (currentPage.value - 1) * 25,
        });
        oramaResults.value = result.tools;
        oramaTotal.value = result.total;
    } catch (e) {
        console.error('Orama search failed:', e);
    }
}

const filterChangeKey = computed(() => {
    if (!props.filterState) return '';
    const f = props.filterState;
    return [
        props.filter,
        props.searchQuery,
        JSON.stringify({
            use_case: f.use_case,
            persona: f.persona,
            setup_difficulty: f.setup_difficulty,
            license: f.license,
            language: f.language,
            hardware: f.hardware,
            deployment: f.deployment,
            model_format: f.model_format,
            maturity: f.maturity,
            features: f.features,
            category: f.category,
            commercial_use: f.commercial_use,
            offline_after_setup: f.offline_after_setup,
            telemetry: f.telemetry,
            last_updated: f.last_updated,
        }),
    ].join('::');
});

const fullSearchKey = computed(() => {
    return [filterChangeKey.value, activeSort.value, currentPage.value].join('::');
});

watch(fullSearchKey, async () => {
    await runOramaSearch();
});

watch(filterChangeKey, () => {
    currentPage.value = 1;
});

watch(isOramaActive, (active) => {
    const el = document.getElementById('ssr-pagination');
    if (el) {
        el.style.display = active ? 'none' : '';
    }
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
        <div
            class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-brand-forest/10 gap-4 mb-6">
            <span class="text-xs font-bold text-brand-forest uppercase tracking-wider">
                <span>{{ toolCount }} result{{ toolCount !== 1 ? 's' : '' }}</span>
            </span>
            <div class="flex items-center gap-2 overflow-x-auto pb-0 md:pb-0 scrollbar-hide">
                <button
                    class="whitespace-nowrap px-3 h-10 rounded-full text-xs font-bold transition-colors border inline-flex items-center"
                    :class="{ 'bg-brand-forest text-white border-brand-forest hover:bg-black hover:border-black': activeSort === 'newest', 'text-brand-muted border-brand-forest/10 hover:border-brand-forest hover:text-brand-forest': activeSort !== 'newest' }"
                    @click="setSort('newest')">Recently added</button>
                <button
                    class="whitespace-nowrap px-3 h-10 rounded-full text-xs font-bold transition-colors border inline-flex items-center"
                    :class="{ 'bg-brand-forest text-white border-brand-forest hover:bg-black hover:border-black': activeSort === 'recently-updated', 'text-brand-muted border-brand-forest/10 hover:border-brand-forest hover:text-brand-forest': activeSort !== 'recently-updated' }"
                    @click="setSort('recently-updated')">Last updated</button>
                <button
                    class="whitespace-nowrap px-3 h-10 rounded-full text-xs font-bold transition-colors border inline-flex items-center"
                    :class="{ 'bg-brand-forest text-white border-brand-forest hover:bg-black hover:border-black': activeSort === 'most-popular', 'text-brand-muted border-brand-forest/10 hover:border-brand-forest hover:text-brand-forest': activeSort !== 'most-popular' }"
                    @click="setSort('most-popular')">Most stars</button>
            </div>
        </div>

        <ul role="list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 m-0 p-0">
            <template v-for="(item, i) in filteredCards" :key="`${item.title}-${i}`">
                <div class="col-span-1 md:col-span-2 flex flex-col md:flex-row items-start md:items-center justify-between p-6 border border-brand-forest/10 bg-brand-bg rounded-3xl transition-all duration-300 ease-out-expo hover:shadow-lg hover:-translate-y-1"
                    v-if="i === 0" v-for="ad in promotedAds" :key="ad.title">
                    <div class="flex-1">
                        <div class="text-xs font-bold uppercase text-brand-forest tracking-wider mb-2">{{ ad.label }}</div>
                        <div class="text-xl font-bold text-brand-forest mb-1">{{ ad.title }}</div>
                        <p class="text-sm font-medium text-brand-muted m-0">{{ ad.description }}</p>
                    </div>
                    <a href="/submit"
                        class="mt-4 md:mt-0 whitespace-nowrap px-6 h-12 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors border-none inline-flex items-center rounded-full shadow-sm">{{ ad.cta }}</a>
                </div>

                <div class="lg:hidden col-span-1 border border-brand-forest/10 p-6 bg-white rounded-3xl transition-all duration-300 ease-out-expo hover:border-brand-forest hover:-translate-y-1 hover:shadow-lg"
                    v-if="i === positions.sponsor" v-for="sponsor in sponsors" :key="'sponsor-' + sponsor.logo">
                    <div class="flex flex-col h-full">
                        <div class="text-xs font-bold uppercase text-brand-muted tracking-wider mb-3">Sponsor</div>
                        <div class="text-xl font-bold text-brand-forest mb-2">{{ sponsor.logo }}</div>
                        <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ sponsor.description }}</p>
                        <button
                            class="w-full h-10 bg-white border border-brand-forest/10 text-brand-forest font-bold hover:bg-brand-teal hover:text-white hover:border-brand-teal transition-colors inline-flex items-center justify-center rounded-full">{{
                            sponsor.cta }}</button>
                    </div>
                </div>

                <div class="lg:hidden col-span-1 border border-brand-forest/10 p-6 bg-white rounded-3xl transition-all duration-300 ease-out-expo hover:border-brand-forest hover:-translate-y-1 hover:shadow-lg"
                    v-if="i === positions.newsletter">
                    <div class="flex flex-col h-full">
                        <div class="text-xs font-bold uppercase text-brand-muted tracking-wider mb-3">{{ c.marketing_newsletter_label || 'Newsletter' }}</div>
                        <div class="text-lg font-bold text-brand-forest mb-2">{{ c.newsletter_title }}</div>
                        <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ c.newsletter_subtitle }}</p>
   
                        <form method="post" action="https://systeme.io/embedded/41620392/subscription">
                            <input
                                class="w-full px-3 h-10 border border-brand-forest/10 font-sans text-sm mb-2 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal outline-none rounded-full"
                                type="text" name="email" :placeholder="c.newsletter_placeholder || 'your@email.com'" />
                            <button
                                class="w-full h-10 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors border-none rounded-full inline-flex items-center justify-center shadow-sm"
                                type="submit">{{ c.newsletter_cta || 'Get the digest' }}</button>
                        </form>
                    </div>
                </div>

                <div class="lg:hidden col-span-1 border border-brand-forest/10 p-6 bg-white rounded-3xl transition-all duration-300 ease-out-expo hover:border-brand-forest hover:-translate-y-1 hover:shadow-lg"
                    v-if="i === positions.featured">
                    <div class="flex flex-col h-full">
                        <div class="text-xs font-bold uppercase text-brand-muted tracking-wider mb-3">Get featured</div>
                        <div class="text-lg font-bold text-brand-forest mb-2">{{ featured.title }}</div>
                        <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ featured.description }}</p>
                        <button
                            class="w-full h-10 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors border-none rounded-full inline-flex items-center justify-center shadow-sm">{{
                            featured.cta }}</button>
                    </div>
                </div>

                <Card :href="item.url" :title="item.title" :body="item.body" :license="item.license"
                    :date-added="item['date-added']" :slug="item.slug" :featured="item.featured"
                    :github-stars="item.popularity_score" :last-updated="item.last_updated"
                    :setup-difficulty="item.setup_difficulty" :features="item.features" :hardware="item.hardware"
                    :commercial-use="item.commercial_use"
                    :category="Array.isArray(item.category) ? item.category[0] : item.category" />
            </template>
        </ul>

        <div v-if="isOramaActive && totalPages > 1"
            class="flex justify-center items-center gap-3 py-12 px-4 md:px-8 border-t border-brand-forest/10 max-w-[1400px] mx-auto">
            <button v-if="currentPage > 1" @click="goToPage(currentPage - 1)"
                class="inline-flex items-center h-12 px-6 border border-brand-forest/10 text-xs font-bold uppercase tracking-wider text-brand-forest hover:bg-brand-forest hover:text-white transition-all duration-200 cursor-pointer rounded-full">
                ← Previous
            </button>
            <span class="px-4 text-xs font-bold uppercase tracking-wider text-brand-muted">
                Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button v-if="currentPage < totalPages" @click="goToPage(currentPage + 1)"
                class="inline-flex items-center h-12 px-6 border border-brand-forest/10 text-xs font-bold uppercase tracking-wider text-brand-forest hover:bg-brand-forest hover:text-white transition-all duration-200 cursor-pointer rounded-full">
                Next <svg class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
        </div>
    </div>
</template>
