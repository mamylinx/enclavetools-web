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
    <h2 class="text-2xl font-bold text-brand-forest pb-4 border-b border-brand-forest/5">Current stack - {{ stackName }}</h2>
    <div v-for="[cat, tools] in groupedStack" :key="cat" class="mb-4">
      <h3 class="text-sm font-bold text-accent-teal uppercase tracking-wider mb-4">{{ cat }}</h3>
      <article v-for="tool in tools" :key="tool.slug"
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white/95 backdrop-blur-sm border border-brand-forest/5 shadow-sm shadow-brand-forest/5 mb-4 gap-4 transition-all duration-200 hover:border-accent-teal/20 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,54,27,0.08)] rounded-3xl">
        <div class="flex-1">
          <strong class="block text-xl font-bold text-brand-forest mb-1">{{ tool.title }}</strong>
          <p class="text-sm text-brand-muted m-0">{{ tool.plain_description || tool.body }}</p>
        </div>
        <button type="button" @click="$emit('remove', tool.slug)"
          class="shrink-0 px-4 h-10 bg-white/90 border border-brand-forest/5 text-brand-forest font-bold hover:bg-accent-red hover:text-white hover:border-accent-red hover:shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2 text-sm rounded-full">
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
