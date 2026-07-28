<script setup lang="ts">
defineEmits<{
  delete: [];
  cancel: [];
}>();
</script>

<template>
  <div class="flex items-center gap-4 mb-3 p-4 bg-red-50 border-2 border-red-600 rounded-3xl">
    <span class="font-bold text-red-800">Delete this stack?</span>
    <button type="button" @click="$emit('delete')"
      class="px-4 h-12 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors cursor-pointer border-none rounded-full shadow-sm">Delete</button>
    <button type="button" @click="$emit('cancel')"
      class="px-4 h-12 bg-white border border-brand-forest/10 text-brand-forest font-bold text-xs uppercase tracking-wider hover:bg-brand-bg transition-colors cursor-pointer rounded-full">Cancel</button>
  </div>
</template>
