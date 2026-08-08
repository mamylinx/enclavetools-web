<script setup lang="ts">
defineEmits<{
  delete: [];
  cancel: [];
}>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-4 mb-3 p-4 bg-linear-to-r from-accent-red/10 via-white/80 to-accent-yellow/8 backdrop-blur-sm border border-accent-red/25 shadow-sm shadow-accent-red/10 rounded-3xl">
    <span class="font-bold text-accent-red">Delete this stack?</span>
    <button type="button" @click="$emit('delete')"
      class="px-6 h-12 bg-gradient-warm text-white font-bold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-accent-red/30 hover:scale-[1.02] transition-all cursor-pointer border-none rounded-full shadow-md shadow-accent-red/20">Delete</button>
    <button type="button" @click="$emit('cancel')"
      class="px-6 h-12 bg-white/90 backdrop-blur-sm border border-brand-forest/5 text-brand-forest font-bold text-xs uppercase tracking-wider hover:bg-white hover:shadow-md transition-all cursor-pointer rounded-full">Cancel</button>
  </div>
</template>
