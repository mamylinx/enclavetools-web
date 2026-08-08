<script setup lang="ts">
import ToolRow from './ToolRow.vue';
import EmptyState from './EmptyState.vue';
import SortBar from './cards/SortBar.vue';
import PromotedAd from './cards/PromotedAd.vue';
import SponsorCard from './cards/SponsorCard.vue';
import NewsletterCard from './cards/NewsletterCard.vue';
import PaginationNav from './cards/PaginationNav.vue';
import { useCardsContainer } from '../composables/useCardsContainer';
import marketingData from '../data/marketing.json';
import siteContent from '../data/site-content.json';
import type { MarketingConfig } from '../interfaces/content';
import type { ToolWithCategory } from '../types';
import type { SortKey } from '../utils/sorting';
import type { FilterState } from '../types';

const m = marketingData as MarketingConfig;
const c = siteContent as Record<string, string>;

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
const emit = defineEmits<{ 'clear-all': [] }>();

const {
  hasNoFilterResults, hasNoSearchResults, toolCount, totalPages,
  activeSort, currentPage, filteredCards, promotedAds, sponsor, positions,
  isOramaActive, isSearchingInCategory, setSort, goToPage,
} = useCardsContainer(props, emit);

const sponsors = (m.sponsors || []);
</script>

<template>
  <div v-if="hasNoFilterResults">
    <EmptyState icon="filter" message="No tools match your filters." action-text="Clear all filters"
      @action="emit('clear-all')" />
  </div>

  <div v-else-if="hasNoSearchResults">
    <EmptyState icon="search" :message="`No results found for &quot;${searchQuery}&quot; in this category.`"
      action-text="Search All Tools" action-href="/" />
  </div>

  <div v-else>
    <SortBar :tool-count="toolCount" :active-sort="activeSort" @set-sort="setSort" />

    <ul role="list" class="flex flex-col gap-1 m-0 p-0">
      <template v-for="(item, i) in filteredCards" :key="item.title + '-' + i">
        <PromotedAd :ad="promotedAds[0]" v-if="i === 0 && promotedAds.length" />
        <SponsorCard :sponsor="sponsors[0]" v-if="i === positions.sponsor && sponsors.length" class="lg:hidden" />
        <NewsletterCard :content="c" v-if="i === positions.newsletter" class="lg:hidden" />
        <li v-if="i === positions.sponsor_cta"
          class="lg:hidden border border-accent-teal/20 p-6 bg-linear-to-br from-brand-tealLight/60 via-white to-accent-green/8 backdrop-blur-sm rounded-3xl shadow-sm shadow-brand-forest/5 transition-all duration-300 ease-out-expo hover:border-accent-teal/40 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,54,27,0.08)]">
          <div class="flex flex-col h-full">
            <div class="text-xs font-bold uppercase text-accent-teal tracking-wider mb-3">{{ sponsor.label || 'Sponsor' }}</div>
            <div class="text-lg font-bold text-brand-forest mb-2">{{ sponsor.title }}</div>
            <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ sponsor.description }}</p>
            <button
              class="w-full h-10 bg-gradient-cool text-white font-bold text-xs uppercase tracking-wider hover:shadow-md hover:shadow-accent-green/30 hover:scale-[1.02] transition-all border-none rounded-full inline-flex items-center justify-center shadow-sm shadow-accent-green/20">{{ sponsor.cta }}</button>
          </div>
        </li>
        <ToolRow :tool="item" />
      </template>
    </ul>

    <PaginationNav v-if="isOramaActive && totalPages > 1"
      :current-page="currentPage" :total-pages="totalPages" @go-to-page="goToPage" />
  </div>
</template>
