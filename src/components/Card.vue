<template>
  <li
    class="relative list-none flex flex-col gap-4 bg-white border border-brand-forest/10 rounded-3xl p-6 transition-all duration-300 ease-out-expo cursor-pointer hover:border-brand-forest hover:-translate-y-1 hover:shadow-lg group"
    :class="{ 'border-brand-teal bg-brand-tealLight': isFeatured }">
    <div v-if="slug" class="absolute top-2 right-2 z-10 hidden group-hover:block">
      <label class="flex items-center gap-2 text-xs cursor-pointer bg-white/90 px-2 py-1 border border-brand-forest/10 rounded-full"
        @click.stop>
        <input type="checkbox" :checked="isCompared" @change="toggleCompare"
          class="w-3 h-3 text-brand-teal border-brand-forest/20 focus:ring-brand-teal" />
        <span class="text-brand-forest font-bold">Compare</span>
      </label>
    </div>
    <a :href="linkUrl" @click="handleClick"
      class="flex flex-col justify-between w-full h-full p-0 text-inherit no-underline gap-3">
      <div class="flex items-start gap-3">
        <div
          class="w-10 h-10 bg-brand-bg border border-brand-forest/10 flex items-center justify-center shrink-0 text-brand-forest font-medium rounded-xl">
          <component :is="categoryIcon" :size="18" :stroke-width="2" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-lg font-extrabold text-brand-forest tracking-[-0.2px] truncate mb-1">
            {{ title }}
            <span v-if="isFeatured"
              class="inline-block text-xs font-extrabold uppercase tracking-widest px-2 py-1 mb-2 bg-brand-tealLight text-brand-teal">Featured</span>
          </div>
          <div class="text-xs text-brand-muted">{{ category }}</div>
        </div>
      </div>
      <div class="text-sm leading-relaxed text-brand-muted m-0 line-clamp-2">{{ body }}</div>
      <div class="flex flex-wrap gap-2">
        <span v-if="setupDifficulty"
          class="items-center h-6 border border-brand-forest/10 px-2.5 text-xs font-bold text-brand-forest bg-brand-tealLight rounded-full"
          :class="setupClass">{{ setupDifficulty }} setup</span>
        <span v-if="primaryHardware"
          class="items-center h-6 border border-brand-forest/10 px-2.5 text-xs font-bold text-brand-forest bg-brand-tealLight rounded-full">{{
          primaryHardware }}</span>
        <span v-if="commercialUse"
          class="items-center h-6 border border-brand-forest/10 px-2.5 text-xs font-bold text-brand-forest bg-brand-tealLight rounded-full">Commercial
          use</span>
      </div>
      <div class="flex items-center justify-between mt-1 gap-3 flex-wrap">
        <span class="text-xs font-bold px-2 py-1 font-sans" :class="priceClass">{{ license }}</span>
        <span class="flex flex-wrap justify-end gap-2 text-brand-muted text-xs font-bold">
          <span v-if="githubStars" class="whitespace-nowrap">★ {{ formattedStars }}</span>
          <span v-if="lastUpdated" class="whitespace-nowrap">Updated {{ formattedUpdated }}</span>
        </span>
      </div>
    </a>
    <div v-if="slug" class="absolute bottom-4 right-4 z-10 hidden group-hover:block">
      <BookmarkButton :slug="slug" :title="title" :body="body" :license="license" :url="href" :category="category || ''"
        :date-added="dateAdded" variant="small" />
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import BookmarkButton from './BookmarkButton.vue';
import categoryIcons from '../data/category-icons.json';
import { iconMap } from '../lib/icons';
import { localStorageAdapter as storage } from '../lib/storage';

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
const isFeatured = computed(() => props.featured);
const isCompared = ref(false);

function syncCompare() {
  if (typeof window === 'undefined' || !props.slug) {
    isCompared.value = false;
    return;
  }
  try {
    const slugs = JSON.parse(storage.getItem('enclavetools-compare') || '[]');
    isCompared.value = slugs.includes(props.slug);
  } catch {
    isCompared.value = false;
  }
}

onMounted(() => {
  syncCompare();
  window.addEventListener('compare:changed', syncCompare);
});

onUnmounted(() => {
  window.removeEventListener('compare:changed', syncCompare);
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
const setupClass = computed(() => {
  const d = (props.setupDifficulty || '').toLowerCase();
  if (d === 'low') return 'before:content-[\'\'] before:w-2 before:h-2 before:mr-2 before:bg-green-600 before:rounded-full before:inline-block';
  if (d === 'medium') return 'before:content-[\'\'] before:w-2 before:h-2 before:mr-2 before:bg-yellow-400 before:rounded-full before:inline-block';
  if (d === 'high') return 'before:content-[\'\'] before:w-2 before:h-2 before:mr-2 before:bg-red-500 before:rounded-full before:inline-block';
  return '';
});

const categoryIcon = computed(() => {
  const iconName = (categoryIcons as Record<string, string>)[props.category || ''];
  if (iconName) {
    const pascalName = iconName.replace(/(?:^|-)(\w)/g, (_, c) => c.toUpperCase());
    const icon = iconMap[pascalName];
    if (icon) return icon;
  }
  return iconMap.Circle;
});

const priceClass = computed(() => {
  if (!props.license) return '';
  const l = props.license.toLowerCase();
  const openSource = ['mit', 'apache', 'bsd', 'gpl', 'lgpl', 'mozilla', 'open'];
  const isOpen = openSource.some(k => l.includes(k));
  if (isOpen) return 'bg-green-50 text-green-800';
  return 'bg-orange-50 text-orange-800';
});

const handleClick = () => {
  window.dispatchEvent(new CustomEvent('tools:save-state'));
};

const toggleCompare = (event: Event) => {
  if (!props.slug || typeof window === 'undefined') return;
  const input = event.target as HTMLInputElement;
  let slugs: string[] = [];
  try {
    slugs = JSON.parse(storage.getItem('enclavetools-compare') || '[]');
  } catch { }

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

  storage.setItem('enclavetools-compare', JSON.stringify(slugs));
  window.dispatchEvent(new CustomEvent('compare:changed', { detail: { slugs } }));
};
</script>
