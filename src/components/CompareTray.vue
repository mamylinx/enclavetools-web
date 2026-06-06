<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { ToolWithCategory } from '../utils/toolModel';

const props = defineProps<{
  tools: ToolWithCategory[];
}>();

const selected = ref<string[]>([]);
const limitHit = ref(false);

const selectedTools = computed(() => selected.value
  .map((slug) => props.tools.find((tool) => tool.slug === slug))
  .filter(Boolean) as ToolWithCategory[]);

function load() {
  try {
    selected.value = JSON.parse(localStorage.getItem('enclavetools-compare') || '[]').slice(0, 4);
  } catch {
    selected.value = [];
  }
}

function clear() {
  selected.value = [];
  localStorage.removeItem('enclavetools-compare');
  window.dispatchEvent(new CustomEvent('compare:changed', { detail: { slugs: [] } }));
}

function handleChanged(event: Event) {
  selected.value = ((event as CustomEvent<{ slugs?: string[] }>).detail?.slugs || []).slice(0, 4);
}

function handleLimit() {
  limitHit.value = true;
  window.setTimeout(() => {
    limitHit.value = false;
  }, 2200);
}

const compareUrl = computed(() => `/compare?tools=${selected.value.join(',')}`);

onMounted(() => {
  load();
  window.addEventListener('compare:changed', handleChanged);
  window.addEventListener('compare:limit', handleLimit);
  window.addEventListener('storage', load);
});

onUnmounted(() => {
  window.removeEventListener('compare:changed', handleChanged);
  window.removeEventListener('compare:limit', handleLimit);
  window.removeEventListener('storage', load);
});
</script>

<template>
  <div v-if="selected.length >= 2 || limitHit" class="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 flex justify-between items-center z-[100]" role="status">
    <div>
      <strong class="mr-3 font-black tracking-wide">Comparing {{ selected.length }} tools</strong>
      <span v-if="!limitHit" class="text-gray-400 text-sm">{{ selectedTools.map((tool) => tool.title).join(' / ') }}</span>
      <span v-else class="text-yellow-400 font-bold text-sm">Maximum 4 tools can be compared.</span>
    </div>
    <div class="flex gap-4 items-center">
      <button type="button" @click="clear" class="text-white opacity-70 hover:opacity-100 text-sm bg-transparent border-2 border-transparent cursor-pointer p-0 transition-opacity">Clear</button>
      <a v-if="selected.length >= 2" :href="compareUrl" class="bg-gray-900 text-white px-4 py-2 font-bold no-underline hover:bg-primary-500 transition-colors border-none">View comparison</a>
    </div>
  </div>
</template>
