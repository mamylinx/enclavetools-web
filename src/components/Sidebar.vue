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
      class="flex flex-col h-full border border-accent-teal/20 p-6 bg-linear-to-br from-brand-tealLight/60 via-white to-accent-green/8 backdrop-blur-sm rounded-3xl shadow-sm shadow-brand-forest/5 transition-all duration-300 ease-out-expo hover:border-accent-teal/40 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,54,27,0.08)]"
      v-if="sponsor">
      <div class="text-xs font-bold uppercase text-accent-teal tracking-wider mb-3">{{ sponsor.label || 'Sponsor' }}
      </div>
      <div class="text-lg font-bold text-brand-forest mb-2">{{ sponsor.title }}</div>
      <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ sponsor.description }}</p>
      <a :href="sponsor.url || '/sponsor'"
        class="block w-full h-10 bg-gradient-cool text-white font-bold text-xs uppercase tracking-wider hover:shadow-md hover:shadow-accent-green/30 hover:scale-[1.02] transition-all text-center no-underline border-none rounded-full inline-flex items-center justify-center shadow-sm shadow-accent-green/20">{{
          sponsor.cta }}</a>
    </div>
    
    <!-- Newsletter -->
    <div class="flex flex-col h-full border border-brand-forest/5 p-6 bg-linear-to-br from-white via-white to-accent-teal/8 backdrop-blur-sm rounded-3xl shadow-sm shadow-brand-forest/5 transition-all duration-300 ease-out-expo hover:border-accent-teal/20 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,54,27,0.08)]" v-if="props.showNewsletter !== false">
      <div class="text-xs font-bold uppercase text-accent-teal tracking-wider mb-3">{{ c.newsletter_label || 'Newsletter' }}</div>
      <div class="text-lg font-bold text-brand-forest mb-2">{{ c.newsletter_title || '5 new tools, every Friday' }}</div>
      <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ c.newsletter_subtitle || 'No fluff. No spam. Join 12,000+ builders.' }}</p>
      <form method="post" action="https://systeme.io/embedded/41620392/subscription">
        <input
          class="w-full px-4 h-10 bg-white/90 border border-brand-forest/5 font-sans text-sm mb-2 focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/30 outline-none rounded-full transition-all"
          type="text" name="email" :placeholder="c.newsletter_placeholder || 'your@email.com'" />
        <button
          class="w-full h-10 bg-gradient-cool text-white font-bold text-xs uppercase tracking-wider hover:shadow-md hover:shadow-accent-green/30 hover:scale-[1.02] transition-all border-none rounded-full inline-flex items-center justify-center shadow-sm shadow-accent-green/20"
          type="submit">{{ c.newsletter_cta || 'Get the digest' }}</button>
      </form>
    </div>
  </aside>
</template>
