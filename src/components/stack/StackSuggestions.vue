<script setup lang="ts">
import { categoryValue, type ToolWithCategory } from '../../utils/toolModel';

defineProps<{
  tools: ToolWithCategory[];
}>();

const emit = defineEmits<{
  add: [slug: string | undefined];
}>();
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-col gap-4">
      <article v-for="tool in tools" :key="tool.slug"
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-gray-50 border-2 border-dashed border-gray-200 gap-4 transition-colors hover:border-solid hover:border-gray-900">
        <div class="flex-1">
          <strong class="block text-lg font-black text-gray-900 mb-1">{{ tool.title }}</strong>
          <span
            class="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs uppercase tracking-wider font-bold mb-2">{{
            categoryValue(tool) }}</span>
          <p class="text-sm text-gray-600 m-0">{{ tool.plain_description || tool.body }}</p>
        </div>
        <button type="button" @click="$emit('add', tool.slug)"
          class="shrink-0 px-3 h-10 bg-white border-2 border-gray-900 text-gray-900 font-bold hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors cursor-pointer inline-flex items-center justify-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Add
        </button>
      </article>
    </div>
  </section>
</template>
