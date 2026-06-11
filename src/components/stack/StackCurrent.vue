<script setup lang="ts">
import type { ToolWithCategory } from '../../utils/toolModel';

defineProps<{
  groupedStack: [string, ToolWithCategory[]][];
  stackName?: string;
}>();

const emit = defineEmits<{
  remove: [slug: string | undefined];
}>();
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="text-2xl font-black text-gray-900 pb-4 border-b-2 border-gray-900">Current stack - {{ stackName }}</h2>
    <div v-for="[cat, tools] in groupedStack" :key="cat" class="mb-4">
      <h3 class="text-sm font-black text-primary-500 uppercase tracking-widest mb-4">{{ cat }}</h3>
      <article v-for="tool in tools" :key="tool.slug"
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border-2 border-gray-200 mb-4 gap-4 transition-colors hover:border-gray-900">
        <div class="flex-1">
          <strong class="block text-lg font-black text-gray-900 mb-1">{{ tool.title }}</strong>
          <p class="text-sm text-gray-600 m-0">{{ tool.plain_description || tool.body }}</p>
        </div>
        <button type="button" @click="$emit('remove', tool.slug)"
          class="shrink-0 px-3 h-10 bg-white border-2 border-gray-900 text-gray-900 font-bold hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors cursor-pointer inline-flex items-center justify-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          Remove
        </button>
      </article>
    </div>
  </section>
</template>
