<script setup lang="ts">
import type { ToolWithCategory } from '../../utils/toolModel';

defineProps<{
  query: string;
  isOpen: boolean;
  filteredGroups: [string, ToolWithCategory[]][];
  filteredFlat: ToolWithCategory[];
  isHighlighted: (slug: string | undefined) => boolean;
}>();

const emit = defineEmits<{
  'update:query': [value: string];
  open: [];
  close: [];
  keydown: [event: KeyboardEvent];
  pick: [slug: string | undefined];
  mouseenter: [index: number];
}>();
</script>

<template>
  <div id="tool-search-anchor" class="flex items-center gap-2 w-full md:w-auto md:border-l md:border-brand-forest/10 md:pl-4 relative mb-4">
    <div class="relative w-full md:w-auto">
      <div class="relative flex items-center">
        <svg class="absolute left-3 text-brand-muted pointer-events-none shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          type="text"
          :value="query"
          @input="$emit('update:query', ($event.target as HTMLInputElement).value); $emit('open')"
          @focus="$emit('open')"
          @keydown="$emit('keydown', $event)"
          placeholder="Search and add a tool…"
          autocomplete="off"
          class="w-full md:w-72 bg-white/95 backdrop-blur-sm text-brand-forest border border-brand-forest/5 shadow-sm shadow-brand-forest/5 pl-9 pr-8 h-12 font-bold text-sm focus:outline-none focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/30 placeholder-brand-muted/60 cursor-text rounded-full transition-all"
          aria-label="Search tools to add"
          aria-autocomplete="list"
          :aria-expanded="isOpen"
          aria-controls="tool-search-dropdown"
          role="combobox"
        />
        <button
          v-if="query"
          type="button"
          @click.stop="$emit('update:query', '')"
          class="absolute right-3 text-brand-muted hover:text-accent-red transition-colors cursor-pointer border-none bg-transparent p-0 leading-none"
          aria-label="Clear search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <div
        v-if="isOpen"
        id="tool-search-dropdown"
        role="listbox"
        aria-label="Tool search results"
        class="absolute z-[1000] mt-2 max-h-60 overflow-auto bg-white/98 backdrop-blur-md border border-brand-forest/5 shadow-lg shadow-brand-forest/10 py-2 w-full min-w-[320px] left-0 md:left-auto md:w-auto rounded-2xl"
      >
        <div v-if="filteredGroups.length === 0" class="px-4 py-6 text-sm text-brand-muted font-bold text-center">
          No tools match "{{ query }}"
        </div>

        <template v-for="[cat, tools] in filteredGroups" :key="cat">
          <div class="px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-accent-teal bg-brand-tealLight/60 backdrop-blur-sm border-b border-brand-forest/5 sticky top-0">
            {{ cat }}
          </div>
          <button
            v-for="tool in tools"
            :key="tool.slug"
            type="button"
            role="option"
            :aria-selected="isHighlighted(tool.slug)"
            :data-highlighted="isHighlighted(tool.slug) ? 'true' : undefined"
            @click.stop="$emit('pick', tool.slug)"
            @mouseenter="$emit('mouseenter', filteredFlat.findIndex(t => t.slug === tool.slug))"
            :class="[
              'w-full text-left px-4 py-2 flex flex-col gap-2 border-b border-brand-forest/5 last:border-0 transition-colors cursor-pointer border-none outline-none',
              isHighlighted(tool.slug)
                ? 'bg-gradient-cool text-white'
                : 'bg-transparent text-brand-forest hover:bg-accent-teal/5'
            ]"
          >
            <span class="font-bold text-sm leading-tight">{{ tool.title }}</span>
            <span
              :class="['text-xs leading-snug truncate', isHighlighted(tool.slug) ? 'text-white/80' : 'text-brand-muted']"
            >{{ (tool.plain_description || tool.body || '').slice(0, 80) }}</span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
