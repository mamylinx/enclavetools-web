<script setup lang="ts">
defineProps<{
  toolCount: number
  activeSort: string
}>()

const emit = defineEmits<{
  'set-sort': [sort: string]
}>()
</script>

<template>
  <div
    class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-brand-forest/10 gap-4 mb-6">
    <span class="text-xs font-bold text-brand-forest uppercase tracking-wider">
      <span>{{ toolCount }} result{{ toolCount !== 1 ? 's' : '' }}</span>
    </span>
    <div class="flex items-center gap-2 overflow-x-auto pb-0 md:pb-0 scrollbar-hide">
      <button
        class="whitespace-nowrap px-3 h-10 rounded-full text-xs font-bold transition-colors border inline-flex items-center"
        :class="{ 'bg-brand-forest text-white border-brand-forest hover:bg-black hover:border-black': activeSort === 'newest', 'text-brand-muted border-brand-forest/10 hover:border-brand-forest hover:text-brand-forest': activeSort !== 'newest' }"
        @click="emit('set-sort', 'newest')">Recently added</button>
      <button
        class="whitespace-nowrap px-3 h-10 rounded-full text-xs font-bold transition-colors border inline-flex items-center"
        :class="{ 'bg-brand-forest text-white border-brand-forest hover:bg-black hover:border-black': activeSort === 'recently-updated', 'text-brand-muted border-brand-forest/10 hover:border-brand-forest hover:text-brand-forest': activeSort !== 'recently-updated' }"
        @click="emit('set-sort', 'recently-updated')">Last updated</button>
      <button
        class="whitespace-nowrap px-3 h-10 rounded-full text-xs font-bold transition-colors border inline-flex items-center"
        :class="{ 'bg-brand-forest text-white border-brand-forest hover:bg-black hover:border-black': activeSort === 'most-popular', 'text-brand-muted border-brand-forest/10 hover:border-brand-forest hover:text-brand-forest': activeSort !== 'most-popular' }"
        @click="emit('set-sort', 'most-popular')">Most stars</button>
    </div>
  </div>
</template>
