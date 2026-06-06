<template>
  <div>
    <div class="p-4 border-b-2 border-gray-200 flex justify-end">
      <button @click="$emit('add')" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">+ Add Filter</button>
    </div>
    <div v-if="options.length === 0" class="p-12 text-center text-gray-500 font-bold text-lg">No filter options.</div>
    <div v-for="(item, idx) in options" :key="item.id || idx" class="flex flex-col p-6 border-b-2 border-gray-200 last:border-b-0 gap-4">
      <div v-if="item._editing" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Group</label>
          <select v-model="item.group_key" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm">
            <option value="use_case">Use Case</option>
            <option value="persona">Persona</option>
            <option value="setup_difficulty">Setup Difficulty</option>
            <option value="maturity">Maturity</option>
            <option value="telemetry">Telemetry</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Value (slug)</label>
          <input v-model="item.value" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Label</label>
          <input v-model="item.label" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Sort Order</label>
          <input v-model.number="item.sort_order" type="number" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex items-center gap-2">
          <input v-model="item.active" type="checkbox" class="w-5 h-5 accent-gray-900" :true-value="1" :false-value="0" />
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Active</label>
        </div>
        <div class="flex gap-3 justify-end md:col-span-2">
          <button @click="saveItem(item)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">Save</button>
          <button @click="cancelEdit(item, options)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">Cancel</button>
        </div>
      </div>
      <div v-else class="flex flex-col md:flex-row justify-between items-start gap-4">
        <div class="flex-1">
          <span class="inline-block text-xs font-black uppercase tracking-widest px-2 py-1 mb-1 bg-gray-100 text-gray-700">{{ item.group_key }}</span>
          <span class="ml-2 text-sm text-gray-500 font-mono">{{ item.value }}</span>
          <span class="ml-2 font-bold text-gray-900">{{ item.label }}</span>
        </div>
        <div class="flex gap-3 shrink-0">
          <button @click="item._editing = true" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">Edit</button>
          <button @click="$emit('delete', item.id)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ options: { type: Array, default: () => [] } });
const emit = defineEmits(['save', 'delete', 'add']);

const saveItem = (item) => {
  emit('save', { ...item });
  item._editing = false;
  item._new = false;
};

const cancelEdit = (item, parent) => {
  if (item._new) {
    const idx = parent.indexOf(item);
    if (idx >= 0) parent.splice(idx, 1);
  }
  item._editing = false;
};
</script>
