<script setup lang="ts">
import { ref } from 'vue';
import marketingData from '../data/marketing.json';
import siteContent from '../data/site-content.json';

const props = defineProps<{
  showSponsor?: boolean;
  showNewsletter?: boolean;
}>();

const m = marketingData as any;
const c = siteContent as Record<string, string>;

const sponsors = ref(m.sponsors || []);
const featured = ref(m.featured?.[0] || null);
const promoted = ref(m.promoted?.[0] || null);
</script>

<template>
  <aside class="flex flex-col gap-6">
    <!-- Sponsor -->
    <div class="flex flex-col h-full border border-gray-200 p-5 bg-white" v-if="props.showSponsor !== false" v-for="sponsor in sponsors" :key="sponsor.title">
      <div class="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">{{ c.marketing_sponsor_label || 'Sponsor' }}</div>
      <div class="text-xl font-black text-gray-900 mb-2">{{ sponsor.title }}</div>
      <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ sponsor.description }}</p>
      <a :href="sponsor.url || '#'" class="block w-full py-2 border border-gray-200 font-bold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors text-center no-underline">{{ sponsor.cta }}</a>
    </div>

    <!-- Newsletter -->
    <div class="flex flex-col h-full border border-gray-200 p-5 bg-white" v-if="props.showNewsletter !== false">
      <div class="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">{{ c.newsletter_label || 'Newsletter' }}</div>
      <div class="text-lg font-black text-gray-900 mb-2">{{ c.newsletter_title || '5 new tools, every Friday' }}</div>
      <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ c.newsletter_subtitle || 'No fluff. No spam. Join 12,000+ builders.' }}</p>
      <input class="w-full px-3 py-2 border border-gray-200 font-sans text-sm mb-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" type="email" :placeholder="c.newsletter_placeholder || 'your@email.com'" />
      <button class="w-full py-2 bg-gray-900 text-white font-bold hover:bg-yellow-400 hover:text-gray-900 transition-colors">{{ c.newsletter_cta || 'Get the digest' }}</button>
    </div>

    <!-- Featured CTA -->
    <div class="flex flex-col h-full border border-gray-200 p-5 bg-white" v-if="featured">
      <div class="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">{{ c.featured_label || 'Featured' }}</div>
      <div class="text-lg font-black text-gray-900 mb-2">{{ featured.title }}</div>
      <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ featured.description }}</p>
      <a :href="featured.url || '/submit'" class="block w-full py-2 bg-gray-900 text-white font-bold hover:bg-yellow-400 hover:text-gray-900 transition-colors text-center no-underline">{{ featured.cta }}</a>
    </div>
  </aside>
</template>
