<template>
  <li class="relative list-none flex flex-col gap-3 bg-white border border-gray-200 p-4.5 transition-all duration-150 cursor-pointer hover:border-gray-400 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] group" :class="{ 'border-gray-900 bg-[#f7f7f2]': isFeatured }">
    <div v-if="slug" class="absolute top-2 right-2 z-10 hidden group-hover:block">
      <label class="flex items-center gap-1 text-xs cursor-pointer bg-white/90 px-2 py-1 border border-gray-200" @click.stop>
        <input type="checkbox" :checked="isCompared" @change="toggleCompare" class="w-3 h-3 text-primary-500 border-gray-300 focus:ring-primary-500" />
        <span class="text-gray-600 font-medium">Compare</span>
      </label>
    </div>
    <a :href="linkUrl" @click="handleClick" class="flex flex-col justify-between w-full h-full p-0 text-inherit no-underline gap-3">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 text-gray-900 font-medium">
          <component :is="categoryIcon" :size="18" :stroke-width="2" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-lg font-extrabold text-gray-900 tracking-[-0.2px] truncate mb-0.5">
            {{ title }}
            <span v-if="isFeatured" class="inline-block text-xs font-black uppercase tracking-widest px-2 py-1 mb-2 bg-primary-100 text-primary-700">Featured</span>
          </div>
          <div class="text-xs text-gray-500">{{ category }}</div>
        </div>
      </div>
      <div class="text-[13px] leading-relaxed text-gray-600 m-0 line-clamp-2">{{ body }}</div>
      <div class="flex flex-wrap gap-1.5">
        <span v-if="setupDifficulty" class="inline-flex items-center min-h-[24px] border border-gray-200 px-2 text-[11px] font-bold text-gray-900 bg-white" :class="setupClass">{{ setupDifficulty }} setup</span>
        <span v-if="primaryHardware" class="inline-flex items-center min-h-[24px] border border-gray-200 px-2 text-[11px] font-bold text-gray-900 bg-white">{{ primaryHardware }}</span>
        <span v-if="commercialUse" class="inline-flex items-center min-h-[24px] border border-gray-200 px-2 text-[11px] font-bold text-gray-900 bg-white">Commercial use</span>
      </div>
      <div class="flex items-center justify-between mt-1 gap-3 flex-wrap">
        <span class="text-[11px] font-semibold px-2.5 py-1 font-sans" :class="priceClass">{{ license }}</span>
        <span class="flex flex-wrap justify-end gap-2.5 text-gray-500 text-xs font-semibold">
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
import { computed } from 'vue';
import BookmarkButton from './BookmarkButton.vue';
import categoryIcons from '../data/category-icons.json';
import * as LucideIcons from 'lucide-vue-next';
import type { Component } from 'vue';

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
const setupClass = computed(() => {
  const d = (props.setupDifficulty || '').toLowerCase();
  if (d === 'low') return 'before:content-[\'\'] before:w-1.5 before:h-1.5 before:mr-1.5 before:bg-green-600 before:rounded-full before:inline-block';
  if (d === 'medium') return 'before:content-[\'\'] before:w-1.5 before:h-1.5 before:mr-1.5 before:bg-yellow-400 before:rounded-full before:inline-block';
  if (d === 'high') return 'before:content-[\'\'] before:w-1.5 before:h-1.5 before:mr-1.5 before:bg-red-500 before:rounded-full before:inline-block';
  return '';
});

const categoryIcon = computed(() => {
  const iconName = (categoryIcons as Record<string, string>)[props.category || ''];
  if (iconName) {
    const pascalName = iconName.replace(/(?:^|-)(\w)/g, (_, c) => c.toUpperCase());
    const icon = (LucideIcons as Record<string, Component>)[pascalName];
    if (icon) return icon;
  }
  return LucideIcons.Circle;
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
