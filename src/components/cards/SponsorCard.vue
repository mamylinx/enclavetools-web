<script setup lang="ts">
import type { MarketingCard } from '../../interfaces/content'

defineProps<{
  sponsor: MarketingCard
}>()
</script>

<template>
  <div
    class="col-span-1 border border-brand-forest/5 p-6 bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm shadow-brand-forest/5 transition-all duration-300 ease-out-expo hover:border-accent-teal/20 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,54,27,0.08)]">
    <div class="flex flex-col h-full">
      <div class="text-xs font-bold uppercase text-accent-yellow tracking-wider mb-3">Sponsor</div>
      <div class="text-xl font-bold text-brand-forest mb-2">{{ sponsor.logo }}</div>
      <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ sponsor.description }}</p>
      <button
        class="w-full h-10 bg-white/90 border border-accent-teal/20 text-accent-teal font-bold hover:bg-accent-teal hover:text-white hover:border-accent-teal hover:shadow-md transition-all inline-flex items-center justify-center rounded-full">{{
        sponsor.cta }}</button>
    </div>
  </div>
</template>
