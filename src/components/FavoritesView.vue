<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getBookmarkedTools, type BookmarkedTool } from '../utils/bookmarks';
import { toolComparators } from '../utils/sorting';
import Card from './Card.vue';
import EmptyState from './EmptyState.vue';

const bookmarkedTools = ref<BookmarkedTool[]>([]);
const isLoading = ref(true);

const loadBookmarks = () => {
  bookmarkedTools.value = getBookmarkedTools();
};

const handleBookmarkChange = () => {
  loadBookmarks();
};

const sortedTools = computed(() => {
  return [...bookmarkedTools.value].sort(toolComparators['dateNewest']);
});

onMounted(() => {
  isLoading.value = false;
  loadBookmarks();
  window.addEventListener('bookmarks:changed', handleBookmarkChange);
});

onUnmounted(() => {
  window.removeEventListener('bookmarks:changed', handleBookmarkChange);
});
</script>

<template>
  <section v-if="isLoading" class="py-16 text-center">
    <p class="text-lg font-bold text-gray-500 uppercase tracking-widest">Loading saved tools...</p>
  </section>

  <section v-else-if="bookmarkedTools.length === 0" class="py-12">
    <EmptyState
      message="Start saving AI tools by clicking the bookmark icon on any tool card. Your saved tools will appear here for quick access."
      action-text="Browse AI Tools" action-href="/" />
  </section>

  <section v-else class="py-12">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b-2 border-gray-900">
      <div class="favorites-info">
        <p class="text-2xl font-black text-gray-900 m-0 tracking-tight">
          {{ bookmarkedTools.length }} {{ bookmarkedTools.length === 1 ? 'tool' : 'tools' }} saved
        </p>
      </div>
    </div>

    <ul role="list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 m-0 p-0">
      <Card v-for="(tool, i) in sortedTools" :key="`${tool.slug}-${i}`" :href="tool.url" :title="tool.title"
        :body="tool.body" :license="tool.license" :date-added="tool['date-added']" :slug="tool.slug"
        :category="tool.category" />
    </ul>
  </section>
</template>
