<script setup lang="ts">
defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  'go-to-page': [page: number]
}>()
</script>

<template>
  <div
    class="flex justify-center items-center gap-3 py-12 px-4 md:px-8 border-t border-brand-forest/5 max-w-[1400px] mx-auto">
    <button v-if="currentPage > 1" @click="emit('go-to-page', currentPage - 1)"
      class="inline-flex items-center gap-2 h-12 px-6 bg-white/90 backdrop-blur-sm border border-brand-forest/5 text-xs font-bold uppercase tracking-wider text-brand-forest hover:bg-gradient-cool hover:text-white hover:border-transparent hover:shadow-md hover:shadow-accent-green/20 transition-all duration-200 cursor-pointer rounded-full">
      ← Previous
    </button>
    <span class="px-4 text-xs font-bold uppercase tracking-wider text-brand-muted">
      Page {{ currentPage }} of {{ totalPages }}
    </span>
    <button v-if="currentPage < totalPages" @click="emit('go-to-page', currentPage + 1)"
      class="inline-flex items-center gap-2 h-12 px-6 bg-white/90 backdrop-blur-sm border border-brand-forest/5 text-xs font-bold uppercase tracking-wider text-brand-forest hover:bg-gradient-cool hover:text-white hover:border-transparent hover:shadow-md hover:shadow-accent-green/20 transition-all duration-200 cursor-pointer rounded-full">
      Next <svg class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
    </button>
  </div>
</template>
