<template>
  <div>
    <div v-if="pages.length === 0" class="p-12 text-center text-gray-500 font-bold text-lg">No legal pages yet.</div>
    <div v-for="page in pages" :key="page.slug" class="flex flex-col p-6 border-b-2 border-gray-200 last:border-b-0 gap-4">
      <div v-if="editingSlug === page.slug" class="grid grid-cols-1 gap-4">
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Slug</label>
          <div class="font-mono font-bold text-gray-700 px-3 py-2 bg-gray-100">{{ page.slug }}</div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Title</label>
          <input v-model="editForm.title" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Body (Markdown)</label>
          <textarea v-model="editForm.body" rows="10" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm font-mono"></textarea>
        </div>
        <div class="flex gap-3 justify-end">
          <button @click="savePage(page.slug)" class="px-5 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">Save</button>
          <button @click="editingSlug = null" class="px-5 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-100">Cancel</button>
        </div>
      </div>
      <div v-else class="flex flex-col md:flex-row justify-between items-start gap-4">
        <div class="flex-1">
          <span class="font-mono text-sm text-gray-500">{{ page.slug }}</span>
          <h4 class="text-lg font-black text-gray-900">{{ page.title }}</h4>
          <p class="text-gray-500 m-0 text-sm line-clamp-2">{{ page.body?.substring(0, 200) }}{{ page.body?.length > 200 ? '...' : '' }}</p>
        </div>
        <button @click="startEdit(page)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-100 shrink-0">Edit</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ pages: { type: Array, default: () => [] } });
const emit = defineEmits(['save']);

const editingSlug = ref(null);
const editForm = ref({ title: '', body: '' });

const startEdit = (page) => {
  editingSlug.value = page.slug;
  editForm.value = { title: page.title || '', body: page.body || '' };
};

const savePage = (slug) => {
  emit('save', slug, { ...editForm.value });
  editingSlug.value = null;
};
</script>
