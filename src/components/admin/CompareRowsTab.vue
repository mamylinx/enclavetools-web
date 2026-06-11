<template>
  <div>
    <div class="p-4 border-b-2 border-gray-200 flex justify-end">
      <button @click="$emit('add')" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">+ Add Row</button>
    </div>
    <div v-if="items.length === 0" class="p-12 text-center text-gray-500 font-bold text-lg">No compare rows defined.</div>
    <div v-for="(item, idx) in items" :key="item.id || idx" class="flex flex-col p-6 border-b-2 border-gray-200 last:border-b-0 gap-4">
      <div v-if="item._editing" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Label</label>
          <input v-model="item.label" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Field Key</label>
          <select v-model="item.field_key" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm font-mono">
            <option v-for="f in fieldOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Sort Order</label>
          <input v-model.number="item.sort_order" type="number" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex gap-3 justify-end md:col-span-2">
          <button @click="saveItem(item)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">Save</button>
          <button @click="cancelEdit(item)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">Cancel</button>
        </div>
      </div>
      <div v-else class="flex flex-col md:flex-row justify-between items-start gap-4">
        <div class="flex-1">
          <span class="font-bold text-gray-900">{{ item.label }}</span>
          <span class="ml-2 text-sm text-gray-500 font-mono">{{ item.field_key }}</span>
          <span class="ml-2 text-xs text-gray-400">(order: {{ item.sort_order }})</span>
        </div>
        <div class="flex gap-3 shrink-0">
          <button @click="startEdit(item)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">Edit</button>
          <button @click="$emit('delete', item.id)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { COMPARE_FIELD_KEYS } from '../../constants/compareFields';

defineProps({ items: { type: Array, default: () => [] } });
const emit = defineEmits(['save', 'delete', 'add']);

const fieldOptions = COMPARE_FIELD_KEYS;

function startEdit(item) {
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
  emit('save', { ...item });
  item._editing = false;
  item._new = false;
}

function findParent(item) {
  return null;
}
</script>
