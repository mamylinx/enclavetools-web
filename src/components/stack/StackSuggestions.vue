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
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-linear-to-br from-brand-tealLight/30 via-white/70 to-accent-yellow/5 backdrop-blur-sm border border-dashed border-brand-forest/10 gap-4 transition-all duration-200 hover:border-solid hover:border-accent-teal/30 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,54,27,0.08)] rounded-3xl">
        <div class="flex-1">
          <strong class="block text-lg font-bold text-brand-forest mb-1">{{ tool.title }}</strong>
          <span
            class="inline-block px-2.5 py-1 bg-accent-teal/10 text-accent-teal border border-accent-teal/20 text-xs uppercase tracking-wider font-bold rounded-full mb-2">{{
            categoryValue(tool) }}</span>
          <p class="text-sm text-brand-muted m-0">{{ tool.plain_description || tool.body }}</p>
        </div>
        <button type="button" @click="$emit('add', tool.slug)"
          class="shrink-0 px-4 h-10 bg-gradient-cool text-white font-bold border-none hover:shadow-md hover:shadow-accent-green/30 hover:scale-[1.02] transition-all cursor-pointer inline-flex items-center justify-center gap-2 text-sm rounded-full shadow-sm shadow-accent-green/20">
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
