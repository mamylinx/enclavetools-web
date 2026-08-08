<script setup lang="ts">
import type { MarketingCard } from '../../interfaces/content'

defineProps<{
  ad: MarketingCard
}>()
</script>

<template>
  <div
    class="col-span-1 md:col-span-2 flex flex-col md:flex-row items-start md:items-center justify-between p-6 border border-brand-forest/5 bg-linear-to-br from-accent-yellow/10 via-white to-brand-tealLight/40 backdrop-blur-sm rounded-3xl shadow-sm shadow-brand-forest/5 transition-all duration-300 ease-out-expo hover:shadow-[0_12px_32px_rgba(27,54,27,0.08)] hover:-translate-y-1">
    <div class="flex-1">
      <div class="text-xs font-bold uppercase text-accent-teal tracking-wider mb-2">{{ ad.label }}</div>
      <div class="text-xl font-bold text-brand-forest mb-1">{{ ad.title }}</div>
      <p class="text-sm font-medium text-brand-muted m-0">{{ ad.description }}</p>
    </div>
    <a href="/submit"
      class="mt-4 md:mt-0 whitespace-nowrap px-8 h-12 bg-gradient-cool text-white font-bold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-accent-green/30 hover:scale-[1.02] transition-all border-none inline-flex items-center rounded-full shadow-md shadow-accent-green/20">{{ ad.cta }}</a>
  </div>
</template>
