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
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-brand-bg border border-dashed border-brand-forest/10 gap-4 transition-colors hover:border-solid hover:border-brand-forest rounded-3xl">
        <div class="flex-1">
          <strong class="block text-lg font-bold text-brand-forest mb-1">{{ tool.title }}</strong>
          <span
            class="inline-block px-2.5 py-1 bg-brand-tealLight text-brand-teal border border-brand-teal/20 text-xs uppercase tracking-wider font-bold rounded-full mb-2">{{
            categoryValue(tool) }}</span>
          <p class="text-sm text-brand-muted m-0">{{ tool.plain_description || tool.body }}</p>
        </div>
        <button type="button" @click="$emit('add', tool.slug)"
          class="shrink-0 px-3 h-10 bg-white border border-brand-forest/10 text-brand-forest font-bold hover:bg-brand-teal hover:text-white hover:border-brand-teal transition-colors cursor-pointer inline-flex items-center justify-center gap-2 text-sm rounded-full">
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
