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

</script>

<template>
  <aside class="flex flex-col gap-6">
    <!-- Sponsor -->
    <div class="flex flex-col h-full border-2 border-gray-200 p-6 bg-white transition-all duration-300 ease-out-expo hover:border-gray-900 hover:-translate-y-1 hover:shadow-card-hover" v-if="props.showSponsor !== false" v-for="sponsor in sponsors" :key="sponsor.title">
      <div class="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">{{ c.marketing_sponsor_label || 'Sponsor' }}</div>
      <div class="text-xl font-black text-gray-900 mb-2">{{ sponsor.title }}</div>
      <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ sponsor.description }}</p>
      <a :href="sponsor.url || '#'" class="block w-full h-10 bg-white border-2 border-gray-900 text-gray-900 font-bold hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors text-center no-underline inline-flex items-center justify-center">{{ sponsor.cta }}</a>
    </div>

    <!-- Newsletter -->
    <div class="flex flex-col h-full border-2 border-gray-200 p-6 bg-white transition-all duration-300 ease-out-expo hover:border-gray-900 hover:-translate-y-1 hover:shadow-card-hover" v-if="props.showNewsletter !== false">
      <div class="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">{{ c.newsletter_label || 'Newsletter' }}</div>
      <div class="text-lg font-black text-gray-900 mb-2">{{ c.newsletter_title || '5 new tools, every Friday' }}</div>
      <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ c.newsletter_subtitle || 'No fluff. No spam. Join 12,000+ builders.' }}</p>
      <form method="post" action="https://systeme.io/embedded/41620392/subscription">
        <input
          class="w-full px-3 h-10 border-2 border-gray-200 font-sans text-sm mb-2 focus:border-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
          type="text" name="email" :placeholder="c.newsletter_placeholder || 'your@email.com'" />
        <button
          class="w-full h-10 bg-gray-900 text-white font-bold hover:bg-primary-500 transition-colors border-none inline-flex items-center justify-center"
          type="submit">{{ c.newsletter_cta || 'Get the digest' }}</button>
      </form>
    </div>

    <!-- Featured CTA -->
    <div class="flex flex-col h-full border-2 border-gray-200 p-6 bg-white transition-all duration-300 ease-out-expo hover:border-gray-900 hover:-translate-y-1 hover:shadow-card-hover" v-if="featured">
      <div class="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">{{ c.featured_label || 'Featured' }}</div>
      <div class="text-lg font-black text-gray-900 mb-2">{{ featured.title }}</div>
      <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ featured.description }}</p>
      <a :href="featured.url || '/submit'" class="block w-full h-10 bg-gray-900 text-white font-bold hover:bg-primary-500 transition-colors text-center no-underline border-none inline-flex items-center justify-center">{{ featured.cta }}</a>
    </div>
  </aside>
</template>
