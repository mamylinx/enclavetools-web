<script setup lang="ts">
import { computed } from 'vue';
import CompareToggle from './CompareToggle.vue';
import { categoryValue } from '../utils/toolModel';
import type { ToolWithCategory } from '../types';

const props = defineProps<{
  tool: ToolWithCategory;
}>();

const category = computed(() => categoryValue(props.tool));

const formattedStars = computed(() => {
  const stars = props.tool.popularity_score ?? 0;
  return stars >= 1000 ? `${(stars / 1000).toFixed(stars >= 10000 ? 0 : 1)}k` : String(stars);
});
</script>

<template>
  <li class="flex items-center gap-3 px-3 py-3 sm:px-4 border-b border-brand-forest/10 last:border-0 hover:bg-brand-tealLight/30 transition-colors">
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <a :href="`/tools/${tool.slug}`" class="text-sm font-bold text-brand-forest hover:text-brand-teal transition-colors">
          {{ tool.title }}
        </a>
        <span class="px-2 py-0.5 bg-brand-tealLight border border-brand-teal/20 text-brand-teal text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0">
          {{ category }}
        </span>
      </div>
      <p class="text-xs text-brand-muted truncate mt-0.5">{{ tool.body }}</p>
      <div class="flex items-center gap-3 mt-1 sm:hidden text-[11px] text-brand-muted">
        <span class="font-bold text-brand-forest flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          {{ formattedStars }}
        </span>
        <span>{{ tool.license || 'Not specified' }}</span>
      </div>
    </div>

    <span class="text-xs font-bold text-brand-forest flex items-center gap-1 shrink-0 w-16 justify-end hidden sm:flex">
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {{ formattedStars }}
    </span>

    <span class="text-xs font-medium text-brand-muted shrink-0 w-24 truncate hidden sm:block">{{ tool.license || 'Not specified' }}</span>

    <CompareToggle v-if="tool.slug" :slug="tool.slug" class="shrink-0" />

    <a :href="`/tools/${tool.slug}`" class="shrink-0 text-brand-teal hover:text-brand-forest transition-colors" :aria-label="`Explore ${tool.title}`">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </a>
  </li>
</template>
