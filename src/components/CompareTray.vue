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
  <div v-if="selected.length >= 2 || limitHit" class="compare-tray" role="status">
    <div>
      <strong>Comparing {{ selected.length }} tools</strong>
      <span v-if="!limitHit">{{ selectedTools.map((tool) => tool.title).join(' / ') }}</span>
      <span v-else>Maximum 4 tools can be compared.</span>
    </div>
    <div class="compare-tray-actions">
      <button type="button" @click="clear">Clear</button>
      <a v-if="selected.length >= 2" :href="compareUrl">View comparison</a>
    </div>
  </div>
</template>
