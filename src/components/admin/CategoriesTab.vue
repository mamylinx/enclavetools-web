<template>
  <div>
    <div v-if="categories.length === 0" class="p-12 text-center text-gray-500 font-bold text-lg">No categories.</div>
    <div v-for="cat in categories" :key="cat.category_slug" class="flex flex-col p-6 border-b-2 border-gray-200 last:border-b-0 gap-4">
      <div v-if="editingSlug === cat.category_slug" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2 flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Slug</label>
          <div class="font-mono font-bold text-gray-700 px-3 py-2 bg-gray-100">{{ cat.category_slug }}</div>
        </div>
        <div class="md:col-span-2 flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Title</label>
          <input v-model="editForm.title" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="md:col-span-2 flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Description</label>
          <textarea v-model="editForm.description" rows="2" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm"></textarea>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Icon Name</label>
          <input v-model="editForm.icon_name" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">OG Image</label>
          <input v-model="editForm.og_image" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Sort Order</label>
          <input v-model.number="editForm.sort_order" type="number" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="md:col-span-2 flex gap-3 justify-end">
          <button @click="saveCategory(cat.category_slug)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">Save</button>
          <button @click="editingSlug = null" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">Cancel</button>
        </div>
      </div>
      <div v-else class="flex flex-col md:flex-row justify-between items-start gap-4">
        <div class="flex-1">
          <span class="font-mono text-sm text-gray-500">{{ cat.category_slug }}</span>
          <h4 class="text-lg font-black text-gray-900">{{ cat.title || cat.category_slug }}</h4>
          <p class="text-gray-600 font-medium m-0 text-sm">{{ cat.description }}</p>
          <div class="flex gap-3 mt-2">
            <span v-if="cat.icon_name" class="text-xs font-mono bg-gray-100 px-2 py-1">Icon: {{ cat.icon_name }}</span>
            <span v-if="cat.sort_order" class="text-xs font-mono bg-gray-100 px-2 py-1">Order: {{ cat.sort_order }}</span>
          </div>
        </div>
        <button @click="startEdit(cat)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500 shrink-0">Edit</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ categories: { type: Array, default: () => [] } });
const emit = defineEmits(['save']);

const editingSlug = ref(null);
const editForm = ref({ title: '', description: '', icon_name: '', og_image: '', sort_order: 0 });

const startEdit = (cat) => {
  editingSlug.value = cat.category_slug;
  editForm.value = {
    title: cat.title || '',
    description: cat.description || '',
    icon_name: cat.icon_name || '',
    og_image: cat.og_image || '',
    sort_order: cat.sort_order || 0,
  };
};

const saveCategory = (slug) => {
  emit('save', slug, { ...editForm.value });
  editingSlug.value = null;
};
</script>
