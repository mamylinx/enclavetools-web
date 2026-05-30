<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import sponsorsData from '../data/sponsors.json';
import featuredData from '../data/featured.json';
import newsletterData from '../data/newsletter.json';
import type { Sponsor, FeaturedConfig, NewsletterData } from '../types';

const props = defineProps<{
  showSponsor?: boolean;
  showNewsletter?: boolean;
}>();

const sponsors = ref<Sponsor[]>(sponsorsData.sponsors);
const featured = ref<FeaturedConfig>(featuredData);
const newsletter = ref<NewsletterData>(newsletterData);
</script>

<template>
  <aside class="flex flex-col gap-6">
    <!-- Sponsor -->
    <div class="flex flex-col h-full border border-gray-200 p-5 bg-white" v-if="props.showSponsor !== false" v-for="sponsor in sponsors" :key="sponsor.logo">
      <div class="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">Sponsor</div>
      <div class="text-xl font-black text-gray-900 mb-2">{{ sponsor.logo }}</div>
      <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ sponsor.description }}</p>
      <button class="w-full py-2 border border-gray-200 font-bold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors">{{ sponsor.cta }}</button>
    </div>

    <!-- Newsletter -->
    <div class="flex flex-col h-full border border-gray-200 p-5 bg-white" v-if="props.showNewsletter !== false">
      <div class="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">Newsletter</div>
      <div class="text-lg font-black text-gray-900 mb-2">{{ newsletter.title }}</div>
      <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ newsletter.subtitle }}</p>
      <input class="w-full px-3 py-2 border border-gray-200 font-sans text-sm mb-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" type="email" :placeholder="newsletter.placeholder" />
      <button class="w-full py-2 bg-gray-900 text-white font-bold hover:bg-yellow-400 hover:text-gray-900 transition-colors">Get the digest</button>
    </div>

    <!-- Featured CTA -->
    <div class="flex flex-col h-full border border-gray-200 p-5 bg-white">
      <div class="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">Get featured</div>
      <div class="text-lg font-black text-gray-900 mb-2">{{ featured.title }}</div>
      <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ featured.description }}</p>
      <button class="w-full py-2 bg-gray-900 text-white font-bold hover:bg-yellow-400 hover:text-gray-900 transition-colors">{{ featured.cta }}</button>
    </div>
  </aside>
</template>
