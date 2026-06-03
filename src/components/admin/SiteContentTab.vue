<template>
  <div>
    <div v-if="items.length === 0" class="p-12 text-center text-gray-500 font-bold text-lg">No site content entries.</div>
    <div v-for="item in items" :key="item.key" class="flex flex-col md:flex-row items-start gap-4 p-4 border-b-2 border-gray-200 last:border-b-0">
      <div class="font-black text-sm uppercase tracking-wider text-gray-700 w-52 shrink-0 pt-2">{{ item.key }}</div>
      <div class="flex-1 min-w-0 w-full">
        <textarea v-if="editingKey === item.key" v-model="editValue" rows="2" class="w-full border-2 border-gray-900 px-3 py-2 font-bold text-sm"></textarea>
        <div v-else class="text-gray-800 font-medium text-sm whitespace-pre-wrap break-words">{{ item.value }}</div>
      </div>
      <div class="flex gap-2 shrink-0">
        <button v-if="editingKey === item.key" @click="save" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">Save</button>
        <button v-if="editingKey === item.key" @click="editingKey = null" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-100">Cancel</button>
        <button v-else @click="startEdit(item.key, item.value)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-100">Edit</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ items: { type: Array, default: () => [] } });
const emit = defineEmits(['save']);

const editingKey = ref(null);
const editValue = ref('');

const startEdit = (key, value) => {
  editingKey.value = key;
  editValue.value = value;
};

const save = () => {
  emit('save', editingKey.value, editValue.value);
  editingKey.value = null;
};
</script>
