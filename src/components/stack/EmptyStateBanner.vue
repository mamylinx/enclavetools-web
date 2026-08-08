<script setup lang="ts">
defineEmits<{
  create: [];
}>();
</script>

<template>
  <div class="py-16 lg:py-24 px-6 text-center bg-linear-to-br from-brand-tealLight/40 via-white/60 to-accent-yellow/8 backdrop-blur-sm border border-dashed border-accent-teal/25 rounded-3xl">
    <h2 class="text-2xl font-bold text-brand-forest mb-4">No stacks yet</h2>
    <p class="text-brand-muted font-bold mb-8 max-w-md mx-auto">
      Create a stack to collect compatible self-hosted AI tools.
    </p>
    <button type="button" @click="$emit('create')"
      class="inline-flex items-center gap-2 px-8 h-12 bg-gradient-cool text-white font-bold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-accent-green/30 hover:scale-[1.02] transition-all cursor-pointer border-none rounded-full shadow-md shadow-accent-green/20">
      + Create your first stack
    </button>
  </div>
</template>
