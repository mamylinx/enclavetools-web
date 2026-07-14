<template>
  <li
    class="flex flex-col h-full bg-white border border-brand-forest/10 rounded-3xl p-6 shadow-sm card-hover"
  >
    <div class="flex items-center justify-between gap-2 mb-4">
      <span
        class="px-2.5 py-1 bg-brand-tealLight border border-brand-teal/20 text-brand-teal text-xs font-bold uppercase tracking-wider rounded-full"
      >{{ category }}</span>
      <span class="text-xs font-bold text-brand-forest flex items-center gap-1 shrink-0">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        {{ formattedStars }}
      </span>
    </div>
    <h3 class="text-xl font-bold tracking-tight text-brand-forest mb-2 font-sans flex items-center gap-2">
      {{ title }}
      <span class="w-2.5 h-2.5 bg-brand-lime border border-brand-forest/10 rounded-full shrink-0"></span>
    </h3>
    <p class="text-brand-muted text-sm leading-relaxed mb-5">{{ body }}</p>
    <div class="grid grid-cols-2 gap-2 border-t border-brand-forest/10 pt-4 mt-auto">
      <div>
        <span class="text-xs font-bold text-brand-muted uppercase tracking-wider block">License</span>
        <span class="text-sm font-bold text-brand-forest">{{ license || 'Not specified' }}</span>
      </div>
      <div>
        <span class="text-xs font-bold text-brand-muted uppercase tracking-wider block">Telemetry</span>
        <span class="text-sm font-bold text-brand-forest">{{ telemetry || 'Not verified' }}</span>
      </div>
      <div>
        <span class="text-xs font-bold text-brand-muted uppercase tracking-wider block">Hardware</span>
        <span class="text-sm font-bold text-brand-forest">{{ primaryHardware }}</span>
      </div>
      <div>
        <span class="text-xs font-bold text-brand-muted uppercase tracking-wider block">Maturity</span>
        <span class="text-sm font-bold text-brand-forest">{{ maturity || 'Not specified' }}</span>
      </div>
    </div>

    <div class="flex items-center gap-2 mt-4">
      <a :href="'/tools/' + slug"
        class="flex-1 text-center py-2.5 bg-brand-teal text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-sm hover:-translate-y-0.5 transition-all">Explore Tools</a>
      <CompareToggle v-if="slug" :slug="slug" />
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CompareToggle from './CompareToggle.vue';

const props = defineProps<{
  href: string;
  title: string;
  body: string;
  license?: string;
  telemetry?: string;
  maturity?: string;
  slug?: string;
  category?: string;
  githubStars?: number;
  popularityScore?: number;
  hardware?: string[];
}>();

const formattedStars = computed(() => {
  const stars = props.popularityScore || props.githubStars || 0;
  return stars >= 1000 ? `${(stars / 1000).toFixed(stars >= 10000 ? 0 : 1)}k` : String(stars);
});

const primaryHardware = computed(() => {
  return props.hardware?.join(', ') || 'Not specified';
});
</script>
