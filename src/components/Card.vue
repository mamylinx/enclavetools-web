<template>
  <li class="link-card" :class="{ featured: isFeatured }">
    <a :href="linkUrl" @click="handleClick">
      <span v-if="isFeatured" class="featured-badge">Featured</span>
      <div class="card-top">
        <div class="card-icon">{{ categoryIcon }}</div>
        <div class="card-meta">
          <div class="card-name">{{ title }}</div>
          <div class="card-cat">{{ category }}</div>
        </div>
      </div>
      <div class="card-desc">{{ body }}</div>
      <div class="card-foot">
        <span class="price-tag" :class="priceClass">{{ license }}</span>
        <span class="card-arrow">↗</span>
      </div>
    </a>
    <div v-if="slug" class="card-bookmark">
      <BookmarkButton :slug="slug" :title="title" :body="body" :license="license" :url="href" :category="category || ''" :date-added="dateAdded" variant="small" />
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BookmarkButton from './BookmarkButton.vue';
import { isRecentlyAdded } from '../utils/dates';

const props = defineProps<{
  href: string;
  title: string;
  body: string;
  license?: string;
  dateAdded?: string;
  slug?: string;
  category?: string;
  featured?: boolean;
}>();

const linkUrl = computed(() => props.slug ? `/tools/${props.slug}` : props.href);
const isNew = computed(() => isRecentlyAdded(props.dateAdded, 30));
const isFeatured = computed(() => props.featured);

const categoryIcon = computed(() => {
  const icons: Record<string, string> = {
    'llm-inference': '◈',
    'llm-models': '◎',
    'vector-databases': '⬡',
    'agent-frameworks': '◇',
    'chat-interfaces': '◻',
    'rag-document': '◆',
    'speech-to-text': '♩',
    'text-to-speech': '♫',
    'image-generation': '◉',
    'fine-tuning-training': '◈',
    'monitoring-observability': '▶',
    'privacy-security': '🔒',
    'embedding-models': '◆',
    'deployment': '▲',
    'workflow-automation': '⚡',
    'video-generation': '◉',
    'vision-multimodal': '◐',
    'code-assistants': '</>',
    'data-utilities': '◎',
  };
  return icons[props.category || ''] || '●';
});

const priceClass = computed(() => {
  if (!props.license) return '';
  return 'p-free';
});

const handleClick = () => {
  window.dispatchEvent(new CustomEvent('tools:save-state'));
};
</script>
