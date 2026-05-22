<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'search', query: string): void;
}>();

const query = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const dispatchSearch = (value: string) => {
  emit('search', value);
  window.dispatchEvent(new CustomEvent('tools:search', {
    detail: { query: value }
  }));
};

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  query.value = target.value;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    dispatchSearch(query.value);
  }, 300);
};

const handleClear = () => {
  query.value = '';
  dispatchSearch('');
  inputRef.value?.focus();
};

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    inputRef.value?.focus();
  }
  if (e.key === 'Escape' && document.activeElement === inputRef.value) {
    inputRef.value?.blur();
    if (query.value) {
      query.value = '';
      dispatchSearch('');
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
});
</script>

<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input ref="inputRef" type="text" class="search-input"
        :placeholder="props.placeholder || 'Search by name, category, or feature...'" :value="query"
        @input="handleInput" aria-label="Search AI tools" />
      <button v-if="query" class="search-clear" @click="handleClear" aria-label="Clear search" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <kbd v-if="!query" class="search-shortcut">⌘K</kbd>
    </div>
  </div>
</template>