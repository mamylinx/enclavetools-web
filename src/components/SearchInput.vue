<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { searchDropdown } from '../composables/useOrama';

const props = defineProps<{
  placeholder?: string;
}>();

interface SearchResult {
  title: string;
  category: string;
  slug: string;
  plain_description: string;
}

const query = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const searchResults = ref<SearchResult[]>([]);
const isDropdownOpen = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const handleInput = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  query.value = target.value;

  if (searchTimeout) clearTimeout(searchTimeout);

  if (query.value.trim() === '') {
    searchResults.value = [];
    isDropdownOpen.value = false;
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const results = await searchDropdown(query.value);
      searchResults.value = results;
      isDropdownOpen.value = results.length > 0;
    } catch {
      searchResults.value = [];
      isDropdownOpen.value = false;
    }
  }, 150);
};

const handleClear = () => {
  query.value = '';
  searchResults.value = [];
  isDropdownOpen.value = false;
  inputRef.value?.focus();
};

const handleResultClick = () => {
  isDropdownOpen.value = false;
  query.value = '';
  searchResults.value = [];
};

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    inputRef.value?.focus();
  }
  if (e.key === 'Escape') {
    if (isDropdownOpen.value) {
      isDropdownOpen.value = false;
    } else if (document.activeElement === inputRef.value) {
      inputRef.value?.blur();
      if (query.value) {
        handleClear();
      }
    }
  }
};

const closeDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.search-container')) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('click', closeDropdown);
  if (searchTimeout) clearTimeout(searchTimeout);
});
</script>

<template>
  <div class="w-full max-w-[520px] mx-auto relative search-container z-[100]">
    <div class="relative flex items-center w-full">
      <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none"
        xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input ref="inputRef" type="text"
        class="w-full bg-white/95 backdrop-blur-sm border border-brand-forest/5 shadow-sm shadow-brand-forest/5 rounded-full py-3 pl-10 pr-12 h-12 text-brand-forest outline-none focus:border-accent-teal focus:shadow-md focus:shadow-accent-teal/10 transition-all placeholder:text-gray-400 text-sm font-medium"
        :placeholder="placeholder || 'Search by name, category, or feature...'" :value="query"
        @input="handleInput" @focus="query.length > 0 && searchResults.length > 0 ? isDropdownOpen = true : null"
        aria-label="Search AI tools" />
      <button v-if="query"
        class="absolute right-[44px] bg-transparent border-none text-brand-muted cursor-pointer p-1 flex items-center justify-center hover:text-accent-red transition-colors"
        @click="handleClear" aria-label="Clear search" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <kbd v-if="!query"
        class="absolute hidden md:block right-3.5 top-1/2 -translate-y-1/2 text-xs text-brand-muted bg-brand-tealLight/60 border border-brand-forest/5 rounded-md px-1.5 py-0.5 font-mono pointer-events-none">⌘K</kbd>
    </div>

    <div v-if="isDropdownOpen && searchResults.length > 0"
      class="absolute left-0 right-0 w-full mt-2 bg-white/98 backdrop-blur-md border border-brand-forest/5 rounded-2xl shadow-2xl shadow-brand-forest/15 overflow-hidden z-[400]">
      <ul class="max-h-[400px] overflow-y-auto py-1 m-0 p-0 list-none">
        <li v-for="result in searchResults" :key="result.slug"
          class="m-0 p-0 border-b border-brand-forest/5 last:border-0">
          <a :href="`/tools/${result.slug}`" @click="handleResultClick"
            class="flex items-start gap-3 px-4 py-3 hover:bg-accent-teal/5 transition-colors group no-underline text-left cursor-pointer">

            <div class="flex-1 min-w-0">
              <div
                class="text-sm font-bold text-brand-forest truncate mb-0.5 group-hover:text-accent-teal transition-colors">
                {{ result.title }}
              </div>
              <div class="text-xs text-brand-muted capitalize leading-tight mb-0.5">{{ result.category.replace(/-/g,
                ' ') }}</div>
              <div class="text-xs leading-snug text-brand-muted/80 m-0 line-clamp-1">{{ result.plain_description }}
              </div>
            </div>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
