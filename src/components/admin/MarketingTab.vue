<template>
  <div>
    <div class="p-4 border-b-2 border-gray-200 flex justify-end">
      <button @click="$emit('add')" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">+ Add Card</button>
    </div>
    <div v-if="cards.length === 0" class="p-12 text-center text-gray-500 font-bold text-lg">No marketing cards.</div>
    <div v-for="card in cards" :key="card.id || card._key" class="flex flex-col p-6 border-b-2 border-gray-200 last:border-b-0 gap-4">
      <div v-if="card._editing" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Type</label>
          <select v-model="card.type" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm">
            <option value="featured">Featured</option>
            <option value="promoted">Promoted</option>
            <option value="sponsor">Sponsor</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Label</label>
          <input v-model="card.label" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="md:col-span-2 flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Title</label>
          <input v-model="card.title" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="md:col-span-2 flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Description</label>
          <textarea v-model="card.description" rows="2" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm"></textarea>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">CTA</label>
          <input v-model="card.cta" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">URL</label>
          <input v-model="card.url" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Logo URL</label>
          <input v-model="card.logo" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Sort Order</label>
          <input v-model.number="card.sort_order" type="number" class="border-2 border-gray-900 px-3 py-2 font-bold text-sm" />
        </div>
        <div class="flex items-center gap-2">
          <input v-model="card.active" type="checkbox" class="w-5 h-5 accent-gray-900" :true-value="1" :false-value="0" />
          <label class="font-black text-xs uppercase tracking-wider text-gray-700">Active</label>
        </div>
        <div class="md:col-span-2 flex gap-3 justify-end">
          <button @click="saveCard(card)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none">Save</button>
          <button @click="cancelEdit(card)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">Cancel</button>
        </div>
      </div>
      <div v-else class="flex flex-col md:flex-row justify-between items-start gap-4">
        <div class="flex-1">
          <span class="inline-block text-xs font-black uppercase tracking-widest px-2 py-1 mb-2" :class="card.type === 'featured' ? 'bg-primary-100 text-primary-700' : card.type === 'promoted' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'">{{ card.type }}</span>
          <h4 class="text-lg font-black text-gray-900">{{ card.title }}</h4>
          <p class="text-gray-600 font-medium m-0 text-sm">{{ card.description }}</p>
        </div>
        <div class="flex gap-3 shrink-0">
          <button @click="startEdit(card)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">Edit</button>
          <button @click="$emit('delete', card.id)" class="px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ cards: { type: Array, default: () => [] } });
const emit = defineEmits(['save', 'delete', 'add']);

let keyCounter = 0;

const startEdit = (card) => {
  card._editing = true;
};

const cancelEdit = (card) => {
  if (card._new) {
    const parent = findParent(card);
    if (parent) parent.splice(parent.indexOf(card), 1);
  }
  card._editing = false;
};

const saveCard = (card) => {
  emit('save', { ...card });
  card._editing = false;
  card._new = false;
};

const findParent = (card) => {
  return null;
};
</script>
