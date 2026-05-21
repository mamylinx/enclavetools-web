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
  <aside class="sidebar">
    <!-- Sponsor -->
    <div class="scard" v-if="props.showSponsor !== false" v-for="sponsor in sponsors" :key="sponsor.logo">
      <div class="scard-label">Sponsor</div>
      <div class="sponsor-logo">{{ sponsor.logo }}</div>
      <p class="sponsor-desc">{{ sponsor.description }}</p>
      <button class="scard-btn-ghost">{{ sponsor.cta }}</button>
    </div>

    <!-- Newsletter -->
    <div class="scard" v-if="props.showNewsletter !== false">
      <div class="scard-label">Newsletter</div>
      <div class="scard-title">{{ newsletter.title }}</div>
      <p class="scard-sub">{{ newsletter.subtitle }}</p>
      <input class="scard-input" type="email" :placeholder="newsletter.placeholder" />
      <button class="scard-btn">Get the digest</button>
    </div>

    <!-- Featured CTA -->
    <div class="scard">
      <div class="scard-label">Get featured</div>
      <div class="scard-title">{{ featured.title }}</div>
      <p class="scard-sub">{{ featured.description }}</p>
      <button class="scard-btn">{{ featured.cta }}</button>
    </div>
  </aside>
</template>
