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
    <h2 class="text-2xl font-extrabold text-brand-forest pb-4 border-b border-brand-forest/10">Current stack - {{ stackName }}</h2>
    <div v-for="[cat, tools] in groupedStack" :key="cat" class="mb-4">
      <h3 class="text-sm font-extrabold text-brand-teal uppercase tracking-widest mb-4">{{ cat }}</h3>
      <article v-for="tool in tools" :key="tool.slug"
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-brand-forest/10 mb-4 gap-4 transition-colors hover:border-brand-forest rounded-3xl">
        <div class="flex-1">
          <strong class="block text-lg font-extrabold text-brand-forest mb-1">{{ tool.title }}</strong>
          <p class="text-sm text-brand-muted m-0">{{ tool.plain_description || tool.body }}</p>
        </div>
        <button type="button" @click="$emit('remove', tool.slug)"
          class="shrink-0 px-3 h-10 bg-white border border-brand-forest/10 text-brand-forest font-bold hover:bg-brand-teal hover:text-white hover:border-brand-teal transition-colors cursor-pointer inline-flex items-center justify-center gap-2 text-sm rounded-full">
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
