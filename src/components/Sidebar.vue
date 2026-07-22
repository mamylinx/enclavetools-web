<script setup lang="ts">
import { ref } from 'vue';
import siteContent from '../data/site-content.json';
import marketingData from '../data/marketing.json';
import type { MarketingConfig } from '../interfaces/content';

const props = defineProps<{
  showNewsletter?: boolean;
}>();

const c = siteContent as Record<string, string>;
const sponsor = ref((marketingData as MarketingConfig).sponsors?.[0] || null);

</script>

<template>
  <aside class="flex flex-col gap-6">
    <!-- Sponsor CTA -->
    <div
      class="flex flex-col h-full border border-brand-teal/20 p-6 bg-brand-tealLight rounded-3xl transition-all duration-300 ease-out-expo hover:border-brand-teal hover:-translate-y-1 hover:shadow-lg"
      v-if="sponsor">
      <div class="text-xs font-bold uppercase text-brand-teal tracking-wider mb-3">{{ sponsor.label || 'Sponsor' }}
      </div>
      <div class="text-lg font-bold text-brand-forest mb-2">{{ sponsor.title }}</div>
      <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ sponsor.description }}</p>
      <a :href="sponsor.url || '/submit'"
        class="block w-full h-10 bg-brand-teal text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-forest transition-colors text-center no-underline border-none rounded-full inline-flex items-center justify-center shadow-sm">{{
          sponsor.cta }}</a>
    </div>
    
    <!-- Newsletter -->
    <div class="flex flex-col h-full border border-brand-forest/10 p-6 bg-white rounded-3xl transition-all duration-300 ease-out-expo hover:border-brand-forest hover:-translate-y-1 hover:shadow-lg" v-if="props.showNewsletter !== false">
      <div class="text-xs font-bold uppercase text-brand-muted tracking-wider mb-3">{{ c.newsletter_label || 'Newsletter' }}</div>
      <div class="text-lg font-bold text-brand-forest mb-2">{{ c.newsletter_title || '5 new tools, every Friday' }}</div>
      <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ c.newsletter_subtitle || 'No fluff. No spam. Join 12,000+ builders.' }}</p>
      <form method="post" action="https://systeme.io/embedded/41620392/subscription">
        <input
          class="w-full px-3 h-10 border border-brand-forest/10 font-sans text-sm mb-2 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal outline-none rounded-full"
          type="text" name="email" :placeholder="c.newsletter_placeholder || 'your@email.com'" />
        <button
          class="w-full h-10 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors border-none rounded-full inline-flex items-center justify-center shadow-sm"
          type="submit">{{ c.newsletter_cta || 'Get the digest' }}</button>
      </form>
    </div>
  </aside>
</template>
