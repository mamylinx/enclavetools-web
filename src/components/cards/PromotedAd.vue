<script setup lang="ts">
import type { MarketingCard } from '../../interfaces/content'

defineProps<{
  ad: MarketingCard
}>()
</script>

<template>
  <div
    class="col-span-1 md:col-span-2 flex flex-col md:flex-row items-start md:items-center justify-between p-6 border border-brand-forest/10 bg-brand-bg rounded-3xl transition-all duration-300 ease-out-expo hover:shadow-lg hover:-translate-y-1">
    <div class="flex-1">
      <div class="text-xs font-bold uppercase text-brand-forest tracking-wider mb-2">{{ ad.label }}</div>
      <div class="text-xl font-bold text-brand-forest mb-1">{{ ad.title }}</div>
      <p class="text-sm font-medium text-brand-muted m-0">{{ ad.description }}</p>
    </div>
    <a href="/submit"
      class="mt-4 md:mt-0 whitespace-nowrap px-6 h-12 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors border-none inline-flex items-center rounded-full shadow-sm">{{ ad.cta }}</a>
  </div>
</template>
