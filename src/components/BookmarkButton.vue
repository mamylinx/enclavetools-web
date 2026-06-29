<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { isBookmarked, toggleBookmark } from '../utils/bookmarks';
import type { BookmarkedTool } from '../types';

const props = defineProps<{
  slug: string;
  title: string;
  body: string;
  tag?: string;
  url: string;
  category: string;
  dateAdded?: string;
  variant?: 'default' | 'small';
  className?: string;
  showLabel?: boolean;
}>();

const bookmarked = ref(false);

const updateBookmarkState = () => {
  if (props.slug) {
    bookmarked.value = isBookmarked(props.slug);
  }
};

const handleClick = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();

  if (!props.slug) return;

  const tool: BookmarkedTool = {
    slug: props.slug,
    title: props.title,
    body: props.body,
    tag: props.tag || '',
    url: props.url,
    category: props.category,
    'date-added': props.dateAdded || '',
  };

  const newState = toggleBookmark(tool);
  bookmarked.value = newState;
  window.dispatchEvent(new CustomEvent('bookmarks:changed'));
};

const handleBookmarkChange = () => {
  if (props.slug) {
    bookmarked.value = isBookmarked(props.slug);
  }
};

onMounted(() => {
  updateBookmarkState();
  window.addEventListener('bookmarks:changed', handleBookmarkChange);
});

onUnmounted(() => {
  window.removeEventListener('bookmarks:changed', handleBookmarkChange);
});
</script>

<template>
  <button
    class="bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 rounded-full"
    :class="[
      props.variant === 'small' ? 'w-8 h-8 border border-brand-forest/10 hover:border-brand-forest' : 'w-12 h-12 border border-brand-forest/10',
      bookmarked ? 'text-brand-teal border-brand-teal hover:text-brand-teal hover:border-brand-teal bg-brand-tealLight' : 'text-brand-muted bg-white',
      props.className
    ]" @click="handleClick" :aria-label="bookmarked ? `Remove ${title} from saved list` : `Add ${title} to saved list`"
    :title="bookmarked ? `Remove ${title} from saved list` : `Add ${title} to saved list`" type="button">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M15 19L9.80769 17.0435L5 19V1H15V19Z" stroke="currentColor" stroke-miterlimit="10"
        :fill="bookmarked ? 'currentColor' : 'none'" />
    </svg>
    <span v-if="props.showLabel" class="ml-2 font-bold text-sm">
      {{ bookmarked ? `Remove ${title} from saved list` : `Add ${title} to saved list` }}
    </span>
  </button>
</template>
