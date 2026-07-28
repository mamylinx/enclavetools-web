<script setup lang="ts">
import type { MarketingCard } from '../../interfaces/content'

defineProps<{
  sponsor: MarketingCard
}>()
</script>

<template>
  <div
    class="col-span-1 border border-brand-forest/10 p-6 bg-white rounded-3xl transition-all duration-300 ease-out-expo hover:border-brand-forest hover:-translate-y-1 hover:shadow-lg">
    <div class="flex flex-col h-full">
      <div class="text-xs font-bold uppercase text-brand-muted tracking-wider mb-3">Sponsor</div>
      <div class="text-xl font-bold text-brand-forest mb-2">{{ sponsor.logo }}</div>
      <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ sponsor.description }}</p>
      <button
        class="w-full h-10 bg-white border border-brand-forest/10 text-brand-forest font-bold hover:bg-brand-teal hover:text-white hover:border-brand-teal transition-colors inline-flex items-center justify-center rounded-full">{{
        sponsor.cta }}</button>
    </div>
  </div>
</template>
