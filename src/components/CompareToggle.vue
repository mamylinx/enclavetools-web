<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { localStorageAdapter as storage } from '../lib/storage';

const props = defineProps<{
  slug: string;
}>();

const isCompared = ref(false);

function syncFromStorage() {
  try {
    const slugs: string[] = JSON.parse(storage.getItem('enclavetools-compare') || '[]');
    isCompared.value = slugs.includes(props.slug);
  } catch {
    isCompared.value = false;
  }
}

onMounted(() => {
  syncFromStorage();
  window.addEventListener('compare:changed', syncFromStorage);
});

onUnmounted(() => {
  window.removeEventListener('compare:changed', syncFromStorage);
});

function toggle() {
  let slugs: string[] = [];
  try {
    slugs = JSON.parse(storage.getItem('enclavetools-compare') || '[]');
  } catch {}

  if (!isCompared.value) {
    if (slugs.length >= 4) {
      window.dispatchEvent(new CustomEvent('compare:limit'));
      return;
    }
    slugs.push(props.slug);
  } else {
    slugs = slugs.filter((s) => s !== props.slug);
  }

  storage.setItem('enclavetools-compare', JSON.stringify(slugs));
  window.dispatchEvent(new CustomEvent('compare:changed', { detail: { slugs } }));
}
</script>

<template>
  <button type="button" @click="toggle"
    class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base transition-colors focus:outline-none"
    :class="isCompared
      ? 'bg-brand-lime text-brand-forest border border-brand-lime'
      : 'bg-brand-bg text-brand-forest border border-brand-forest/10 hover:bg-brand-lime'"
    :title="isCompared ? 'Remove from comparison' : 'Add to comparison'"
    :aria-label="isCompared ? 'Remove from comparison' : 'Add to comparison'">
    <svg v-if="isCompared" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
    <span v-else class="leading-none">＋</span>
  </button>
</template>
