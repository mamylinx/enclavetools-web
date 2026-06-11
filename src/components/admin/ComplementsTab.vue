<template>
  <div>
    <div class="p-4 border-b-2 border-gray-200 flex justify-end">
      <button @click="$emit('add')" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">+ Add Complement</button>
    </div>
    <div v-if="items.length === 0" class="p-12 text-center text-gray-500 font-bold text-lg">No complement mappings.</div>
    <div v-for="(item, idx) in items" :key="item.category_slug || idx" class="flex flex-col p-6 border-b-2 border-gray-200 last:border-b-0 gap-4">
      <div v-if="item._editing" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Category</label>
          <select v-model="item.category_slug" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" :disabled="!item._new">
            <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Complements (select categories)</label>
          <div class="border-2 border-gray-900 p-2 max-h-48 overflow-y-auto">
            <label v-for="cat in categoryOptions" :key="'comp-'+cat.value" class="flex items-center gap-2 py-1 cursor-pointer">
              <input type="checkbox" :value="cat.value" v-model="item.selectedComplements" class="w-4 h-4 accent-gray-900" />
              <span class="font-bold text-sm">{{ cat.label }}</span>
            </label>
          </div>
        </div>
        <div class="flex gap-3 justify-end md:col-span-2">
          <button @click="saveItem(item)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">Save</button>
          <button @click="cancelEdit(item)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">Cancel</button>
        </div>
      </div>
      <div v-else class="flex flex-col md:flex-row justify-between items-start gap-4">
        <div class="flex-1">
          <span class="inline-block text-xs font-black uppercase tracking-widest px-2 py-1 mb-1 bg-gray-100 text-gray-700 font-mono">{{ item.category_slug }}</span>
          <span class="ml-2 text-gray-600 font-medium">{{ formatComplements(item.complements) }}</span>
        </div>
        <div class="flex gap-3 shrink-0">
          <button @click="startEdit(item)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">Edit</button>
          <button @click="$emit('delete', item.category_slug)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] }
});
const emit = defineEmits(['save', 'delete', 'add']);

const categoryOptions = computed(() =>
  props.categories
    .filter(c => c.category_slug && c.category_slug !== 'all')
    .map(c => ({ label: c.title, value: c.category_slug }))
);

function formatComplements(complements) {
  if (!complements) return '';
  const arr = typeof complements === 'string' ? JSON.parse(complements) : complements;
  const labels = arr.map(slug => {
    const cat = props.categories.find(c => c.category_slug === slug);
    return cat ? cat.title : slug;
  });
  return labels.join(', ');
}

function startEdit(item) {
  const arr = typeof item.complements === 'string' ? JSON.parse(item.complements) : (item.complements || []);
  item.selectedComplements = [...arr];
  item._editing = true;
}

function cancelEdit(item) {
  if (item._new) {
    const parent = findParent(item);
    if (parent) parent.splice(parent.indexOf(item), 1);
  }
  item._editing = false;
}

function saveItem(item) {
  emit('save', {
    category_slug: item.category_slug,
    complements: item.selectedComplements,
    _editing: item._editing,
    _new: item._new
  });
  item._editing = false;
  item._new = false;
}

function findParent(item) {
  return null;
}
</script>
