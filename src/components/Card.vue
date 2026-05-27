<template>
  <li class="link-card" :class="{ featured: isFeatured }">
    <div v-if="slug" class="card-compare">
      <label class="compare-check" @click.stop>
        <input type="checkbox" :checked="isCompared" @change="toggleCompare" />
        <span>Compare</span>
      </label>
    </div>
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
      <div class="card-signals">
        <span v-if="setupDifficulty" class="signal-dot" :class="setupClass">{{ setupDifficulty }} setup</span>
        <span v-if="primaryHardware" class="signal-chip">{{ primaryHardware }}</span>
        <span v-if="commercialUse" class="signal-chip">Commercial use</span>
      </div>
      <div class="card-foot">
        <span class="price-tag" :class="priceClass">{{ license }}</span>
        <span class="card-stats">
          <span v-if="githubStars" class="card-stat">★ {{ formattedStars }}</span>
          <span v-if="lastUpdated" class="card-stat">Updated {{ formattedUpdated }}</span>
        </span>
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
  githubStars?: number;
  lastUpdated?: string;
  setupDifficulty?: string;
  features?: string[];
  hardware?: string[];
  commercialUse?: boolean;
}>();

const linkUrl = computed(() => props.slug ? `/tools/${props.slug}` : props.href);
const isNew = computed(() => isRecentlyAdded(props.dateAdded, 30));
const isFeatured = computed(() => props.featured);
const isCompared = computed(() => {
  if (typeof window === 'undefined' || !props.slug) return false;
  try {
    return JSON.parse(localStorage.getItem('enclavetools-compare') || '[]').includes(props.slug);
  } catch {
    return false;
  }
});
const primaryHardware = computed(() => props.hardware?.find((item) => item.includes('CPU') || item.includes('CUDA') || item.includes('Apple')) || props.hardware?.[0]);
const formattedStars = computed(() => {
  const stars = props.githubStars || 0;
  return stars >= 1000 ? `${(stars / 1000).toFixed(stars >= 10000 ? 0 : 1)}k` : String(stars);
});
const formattedUpdated = computed(() => {
  if (!props.lastUpdated) return '';
  const diff = Date.now() - new Date(props.lastUpdated).getTime();
  const days = Math.max(0, Math.floor(diff / 86400000));
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
});
const setupClass = computed(() => `setup-${(props.setupDifficulty || '').toLowerCase()}`);

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

const toggleCompare = (event: Event) => {
  if (!props.slug || typeof window === 'undefined') return;
  const input = event.target as HTMLInputElement;
  let slugs: string[] = [];
  try {
    slugs = JSON.parse(localStorage.getItem('enclavetools-compare') || '[]');
  } catch {}

  if (input.checked && !slugs.includes(props.slug)) {
    if (slugs.length >= 4) {
      input.checked = false;
      window.dispatchEvent(new CustomEvent('compare:limit'));
      return;
    }
    slugs.push(props.slug);
  } else if (!input.checked) {
    slugs = slugs.filter((slug) => slug !== props.slug);
  }

  localStorage.setItem('enclavetools-compare', JSON.stringify(slugs));
  window.dispatchEvent(new CustomEvent('compare:changed', { detail: { slugs } }));
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
