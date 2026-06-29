<template>
  <div>
    <div class="flex flex-col gap-6 max-w-6xl mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-forest/10 pb-4">
        <div class="inline-flex items-center gap-2 bg-brand-tealLight text-brand-teal border-2 border-brand-teal px-4 py-2 font-extrabold uppercase tracking-widest text-xs">
          <span class="w-2 h-2 bg-brand-teal rounded-full animate-pulse block"></span>
          {{ pendingCount }} Pending
        </div>
      </div>

      <div class="bg-white border border-brand-forest/10 shadow-sm">
        <PendingTab :tools="pendingTools" @approve="approveTool" @reject="rejectTool" @delete="deleteTool" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import PendingTab from './admin/PendingTab.vue';

const loggedIn = ref(true);

const pendingTools = ref([]);
const storeMessage = ref('');
const storeMessageType = ref('success');

const pendingCount = computed(() => pendingTools.value.length);

onMounted(() => {
  if (loggedIn.value) fetchPending();
});

const showMessage = (msg, type = 'success') => {
  storeMessage.value = msg;
  storeMessageType.value = type;
  setTimeout(() => { storeMessage.value = ''; }, 4000);
};

const fetchPending = async () => {
  const res = await fetch('/api/admin/list');
  if (res.status === 401) { loggedIn.value = false; return; }
  const data = await res.json();
  pendingTools.value = data.tools || [];
};

const approveTool = async (id) => {
  try {
    const res = await fetch(`/api/admin/tools/${id}/approve`, { method: 'POST' });
    if (res.ok) {
      const tool = pendingTools.value.find(t => t.id === id);
      if (tool) tool.status = 'approved';
      showMessage('Tool approved successfully');
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error approving tool', 'error'); }
};

const rejectTool = async (id, explanation) => {
  try {
    const res = await fetch(`/api/admin/tools/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ explanation })
    });
    if (res.ok) {
      const tool = pendingTools.value.find(t => t.id === id);
      if (tool) { tool.status = 'rejected'; tool.explanation = explanation || null; }
      showMessage('Tool rejected');
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error rejecting tool', 'error'); }
};

const deleteTool = async (id) => {
  try {
    const res = await fetch(`/api/admin/tools/${id}/delete`, { method: 'POST' });
    if (res.ok) {
      pendingTools.value = pendingTools.value.filter(t => t.id !== id);
      showMessage('Tool removed from pending');
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error deleting tool', 'error'); }
};
</script>
