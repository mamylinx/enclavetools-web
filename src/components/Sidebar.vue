<script setup lang="ts">
import { ref } from 'vue';
import siteContent from '../data/site-content.json';
import marketingData from '../data/marketing.json';
import type { MarketingConfig } from '../interfaces/content';

const props = defineProps<{
  showNewsletter?: boolean;
}>();

const c = siteContent as Record<string, string>;
const featured = ref((marketingData as MarketingConfig).featured?.[0] || null);

</script>

<template>
  <aside class="flex flex-col gap-6">
    <!-- Newsletter -->
    <div class="flex flex-col h-full border border-brand-forest/10 p-6 bg-white rounded-3xl transition-all duration-300 ease-out-expo hover:border-brand-forest hover:-translate-y-1 hover:shadow-lg" v-if="props.showNewsletter !== false">
      <div class="text-xs font-extrabold uppercase text-brand-muted tracking-wider mb-3">{{ c.newsletter_label || 'Newsletter' }}</div>
      <div class="text-lg font-extrabold text-brand-forest mb-2">{{ c.newsletter_title || '5 new tools, every Friday' }}</div>
      <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ c.newsletter_subtitle || 'No fluff. No spam. Join 12,000+ builders.' }}</p>
      <form method="post" action="https://systeme.io/embedded/41620392/subscription">
        <input
          class="w-full px-3 h-10 border border-brand-forest/10 font-sans text-sm mb-2 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal outline-none"
          type="text" name="email" :placeholder="c.newsletter_placeholder || 'your@email.com'" />
        <button
          class="w-full h-10 bg-brand-forest text-white font-bold hover:bg-brand-teal transition-colors border-none rounded-full inline-flex items-center justify-center"
          type="submit">{{ c.newsletter_cta || 'Get the digest' }}</button>
      </form>
    </div>

    <!-- Featured CTA -->
    <div class="flex flex-col h-full border border-brand-forest/10 p-6 bg-white rounded-3xl transition-all duration-300 ease-out-expo hover:border-brand-forest hover:-translate-y-1 hover:shadow-lg" v-if="featured">
      <div class="text-xs font-extrabold uppercase text-brand-muted tracking-wider mb-3">{{ c.featured_label || 'Featured' }}</div>
      <div class="text-lg font-extrabold text-brand-forest mb-2">{{ featured.title }}</div>
      <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ featured.description }}</p>
      <a :href="featured.url || '/submit'" class="block w-full h-10 bg-brand-forest text-white font-bold hover:bg-brand-teal transition-colors text-center no-underline border-none rounded-full inline-flex items-center justify-center">{{ featured.cta }}</a>
    </div>
  </aside>
</template>
