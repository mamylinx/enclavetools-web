<script setup lang="ts">
defineEmits<{
  create: [];
}>();
</script>

<template>
  <div class="py-16 lg:py-24 text-center bg-brand-bg border border-dashed border-brand-forest/20 rounded-3xl">
    <h2 class="text-2xl font-bold text-brand-forest mb-4">No stacks yet</h2>
    <p class="text-brand-muted font-bold mb-8 max-w-md mx-auto">
      Create a stack to collect compatible self-hosted AI tools.
    </p>
    <button type="button" @click="$emit('create')"
      class="inline-flex items-center gap-2 px-4 h-12 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors cursor-pointer border-none rounded-full shadow-sm">
      + Create your first stack
    </button>
  </div>
</template>
