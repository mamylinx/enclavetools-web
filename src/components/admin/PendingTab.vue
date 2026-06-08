<template>
  <div>
    <div v-if="tools.length === 0" class="p-12 text-center text-gray-500 font-bold text-lg">No pending tools to review.</div>
    <div v-for="tool in tools" :key="tool.id" class="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b-2 border-gray-200 last:border-b-0 gap-6">
      <div class="flex-1 min-w-0">
        <h4 class="text-xl font-black text-gray-900 mb-2">{{ tool.name }}</h4>
        <p class="text-gray-600 font-medium mb-4 max-w-2xl leading-relaxed m-0">{{ tool.description }}</p>
        <div class="flex flex-wrap gap-3">
          <span class="text-xs font-bold text-gray-700 bg-gray-100 border-2 border-gray-300 px-2 py-1 uppercase tracking-wider">Category: {{ tool.category }}</span>
          <span v-if="tool.github_url" class="text-xs font-bold text-gray-700 bg-gray-100 border-2 border-gray-300 px-2 py-1 uppercase tracking-wider">GitHub: <a :href="tool.github_url" target="_blank" class="text-primary-500 hover:text-primary-600 underline">Link</a></span>
        </div>
      </div>
      <div class="flex w-full md:w-auto gap-3 shrink-0">
        <button @click="$emit('reject', tool.id)" class="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600">Reject</button>
        <button @click="$emit('approve', tool.id)" class="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">Approve</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ tools: { type: Array, default: () => [] } });
defineEmits(['approve', 'reject']);
</script>
