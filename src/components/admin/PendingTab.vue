<template>
  <div>
    <div v-if="tools.length === 0" class="p-12 text-center text-brand-muted font-bold text-lg">No pending tools to review.</div>
    <div v-for="tool in tools" :key="tool.id" class="flex flex-col p-6 border-b border-brand-forest/10 last:border-b-0 gap-4">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <a :href="tool.url" target="_blank" class="text-brand-teal hover:text-brand-teal underline font-bold text-sm break-all">{{ tool.url }}</a>
            <span v-if="tool.status === 'pending'" class="inline-flex items-center px-3 py-1 text-xs font-extrabold uppercase tracking-wider bg-yellow-50 border-2 border-yellow-400 text-yellow-700">Pending</span>
            <span v-if="tool.status === 'approved'" class="inline-flex items-center px-3 py-1 text-xs font-extrabold uppercase tracking-wider bg-green-50 border-2 border-green-500 text-green-700">Approved ✓</span>
            <span v-if="tool.status === 'rejected'" class="inline-flex items-center px-3 py-1 text-xs font-extrabold uppercase tracking-wider bg-red-50 border-2 border-red-400 text-red-700">Rejected</span>
          </div>
          <p class="text-xs font-bold text-brand-muted">{{ formatDate(tool.submitted_at) }}</p>
          <p v-if="tool.status === 'rejected' && tool.explanation" class="mt-2 text-sm font-bold text-red-600 bg-red-50 border-2 border-red-200 px-3 py-2">{{ tool.explanation }}</p>
          <p v-if="tool.status !== 'rejected' && tool.explanation && rejectInput !== tool.id" class="mt-2 text-sm font-bold text-red-600 bg-red-50 border-2 border-red-200 px-3 py-2">{{ tool.explanation }}</p>
        </div>
        <div class="flex flex-col w-full md:w-auto gap-3 shrink-0">
          <div v-if="tool.status === 'pending'" class="flex flex-col gap-3">
            <div v-if="rejectInput === tool.id" class="flex flex-col gap-3">
              <textarea v-model="rejectReason" placeholder="Reason for rejection..." rows="2" class="w-full bg-white border border-brand-forest/10 px-3 py-2 font-bold text-brand-forest text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal transition-colors resize-none"></textarea>
              <div class="flex gap-2">
                <button @click="cancelReject" class="flex-1 inline-flex items-center justify-center px-4 py-2 font-extrabold uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border border-brand-forest/20 text-brand-muted hover:bg-brand-tealLight">Cancel</button>
                <button @click="confirmReject(tool.id)" class="flex-1 inline-flex items-center justify-center px-4 py-2 font-extrabold uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600 rounded-full">Reject</button>
              </div>
            </div>
            <div v-else class="flex w-full md:w-auto gap-3">
              <button @click="startReject(tool.id)" class="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 font-extrabold uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600 rounded-full">Reject</button>
              <button @click="$emit('approve', tool.id)" class="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 font-extrabold uppercase tracking-wider text-xs transition-colors cursor-pointer bg-brand-forest text-white hover:bg-brand-teal border-none rounded-full">Approve</button>
              <button @click="$emit('delete', tool.id)" class="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 font-extrabold uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border border-brand-forest/20 text-brand-muted hover:bg-brand-bg hover:text-brand-forest/80 hover:border-brand-muted">Delete</button>
            </div>
          </div>
          <div v-else class="flex justify-end">
            <button @click="$emit('delete', tool.id)" class="inline-flex items-center justify-center px-4 py-2 font-extrabold uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border border-brand-forest/20 text-brand-muted hover:bg-brand-bg hover:text-brand-forest/80 hover:border-brand-muted">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({ tools: { type: Array, default: () => [] } });
const emit = defineEmits(['approve', 'reject', 'delete']);

const rejectInput = ref(null);
const rejectReason = ref('');

const startReject = (id) => {
  rejectInput.value = id;
  rejectReason.value = '';
};

const cancelReject = () => {
  rejectInput.value = null;
  rejectReason.value = '';
};

const confirmReject = (id) => {
  emit('reject', id, rejectReason.value);
  rejectInput.value = null;
  rejectReason.value = '';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};
</script>
