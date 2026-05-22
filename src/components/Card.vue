<template>
  <li class="link-card" :class="{ featured: isFeatured }">
    <a :href="linkUrl" @click="handleClick">
      <div class="card-top">
        <div class="card-icon">
          <component :is="categoryIcon" :size="18" :stroke-width="2" />
        </div>
        <div class="card-meta">
          <div class="card-name">
            {{ title }}
            <span v-if="isFeatured" class="featured-badge-inline">Featured</span>
          </div>
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
      <BookmarkButton :slug="slug" :title="title" :body="body" :license="license" :url="href" :category="category || ''"
        :date-added="dateAdded" variant="small" />
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BookmarkButton from './BookmarkButton.vue';
import { isRecentlyAdded } from '../utils/dates';
import { 
  Cpu, Brain, Database, Network, MessageSquare, 
  FileText, Mic, Volume2, Image as ImageIcon, Wrench, 
  Activity, Shield, Layers, Server, Zap, 
  Video, Eye, Code, Table, Circle 
} from 'lucide-vue-next';

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
  const icons: Record<string, any> = {
    'llm-inference': Cpu,
    'llm-models': Brain,
    'vector-databases': Database,
    'agent-frameworks': Network,
    'chat-interfaces': MessageSquare,
    'rag-document': FileText,
    'speech-to-text': Mic,
    'text-to-speech': Volume2,
    'image-generation': ImageIcon,
    'fine-tuning-training': Wrench,
    'monitoring-observability': Activity,
    'privacy-security': Shield,
    'embedding-models': Layers,
    'deployment': Server,
    'workflow-automation': Zap,
    'video-generation': Video,
    'vision-multimodal': Eye,
    'code-assistants': Code,
    'data-utilities': Table,
  };
  return icons[props.category || ''] || Circle;
});

const priceClass = computed(() => {
  if (!props.license) return '';
  const l = props.license.toLowerCase();
  const openSource = ['mit', 'apache', 'bsd', 'gpl', 'lgpl', 'mozilla', 'open'];
  const isOpen = openSource.some(k => l.includes(k));
  if (isOpen) return 'p-free';
  return 'p-custom';
});

const handleClick = () => {
  window.dispatchEvent(new CustomEvent('tools:save-state'));
};
</script>

<style scoped>
.featured-badge-inline {
  display: inline-block;
  vertical-align: middle;
  font-size: 10px;
  font-weight: 600;
  background: var(--accent-blue);
  color: var(--white);
  padding: 2px 6px;
  border-radius: 12px;
  letter-spacing: 0.02em;
  margin-left: 6px;
  margin-top: -2px;
}
</style>
