<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getBookmarkedTools, type BookmarkedTool } from '../utils/bookmarks';
import { toolComparators, type SortKey } from '../utils/sorting';
import Card from './Card.vue';
import EmptyState from './EmptyState.vue';

type FavoritesSortKey = Exclude<SortKey, 'random'>;

const bookmarkedTools = ref<BookmarkedTool[]>([]);
const sortBy = ref<FavoritesSortKey>('nameAsc');
const isLoading = ref(true);

const loadBookmarks = () => {
  bookmarkedTools.value = getBookmarkedTools();
};

const handleBookmarkChange = () => {
  loadBookmarks();
};

const sortedTools = computed(() => {
  return [...bookmarkedTools.value].sort(toolComparators[sortBy.value]);
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
  <section v-if="isLoading">
    <p class="loading-text">Loading saved tools...</p>
  </section>

  <section v-else-if="bookmarkedTools.length === 0">
    <EmptyState
      message="Start saving AI tools by clicking the bookmark icon on any tool card. Your saved tools will appear here for quick access."
      action-text="Browse AI Tools"
      action-href="/"
    />
  </section>

  <section v-else>
    <div class="favorites-header">
      <div class="favorites-info">
        <p class="toolbar-count">
          {{ bookmarkedTools.length }} {{ bookmarkedTools.length === 1 ? 'tool' : 'tools' }} saved
        </p>
      </div>

      <div class="favorites-controls">
        <select
          :value="sortBy"
          @change="(e) => sortBy = (e.target as HTMLSelectElement).value as FavoritesSortKey"
          class="sort-select"
        >
          <option value="nameAsc">Name (A-Z)</option>
          <option value="nameDesc">Name (Z-A)</option>
          <option value="dateNewest">Newest First</option>
          <option value="dateOldest">Oldest First</option>
        </select>
      </div>
    </div>

    <ul role="list" class="link-card-grid">
      <Card
        v-for="(tool, i) in sortedTools"
        :key="`${tool.slug}-${i}`"
        :href="tool.url"
        :title="tool.title"
        :body="tool.body"
        :license="tool.license"
        :date-added="tool['date-added']"
        :slug="tool.slug"
        :category="tool.category"
      />
    </ul>
  </section>
</template>
