<template>
  <div>
    <div v-if="!loggedIn" class="max-w-[400px] mx-auto bg-gray-50 border-2 border-gray-900 p-8 shadow-brutal">
      <h2 class="text-xl font-black text-gray-900 mb-6 text-center uppercase tracking-wide">Admin Login</h2>
      <form @submit.prevent="login" class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Password</label>
          <input type="password" v-model="password" required class="w-full bg-white border-2 border-gray-900 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
        </div>
        <p v-if="loginError" class="text-sm font-bold text-red-600 m-0">{{ loginError }}</p>
        <button type="submit" class="w-full inline-flex items-center justify-center px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-primary-500 border-none" :disabled="isLoggingIn">
          {{ isLoggingIn ? 'Logging in...' : 'Sign In' }}
        </button>
      </form>
    </div>

    <div v-else class="flex flex-col gap-6 max-w-6xl mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-gray-900 pb-4">
        <div class="inline-flex items-center gap-2 bg-primary-50 text-primary-600 border-2 border-primary-500 px-4 py-2 font-black uppercase tracking-widest text-xs">
          <span class="w-2 h-2 bg-primary-500 rounded-full animate-pulse block"></span>
          {{ pendingCount }} Pending
        </div>
        <div class="flex flex-wrap gap-3">
          <button @click="rebuild" :disabled="isRebuilding" class="inline-flex items-center justify-center px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-primary-500 border-none">
            {{ isRebuilding ? 'Triggering...' : 'Rebuild Pages' }}
          </button>
          <button @click="logout" class="inline-flex items-center justify-center px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">
            Logout
          </button>
        </div>
      </div>

      <div v-if="rebuildMessage" class="p-4 font-bold text-sm border-2" :class="rebuildMessage.includes('Error') ? 'bg-red-50 text-red-600 border-red-600' : 'bg-green-50 text-green-700 border-green-600'">
        {{ rebuildMessage }}
      </div>

      <div class="flex flex-wrap gap-1 border-b-2 border-gray-200 pb-0">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
          class="px-4 py-3 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer border-b-2 -mb-[2px]"
          :class="activeTab === tab.key ? 'border-gray-900 text-gray-900 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-400 bg-gray-50'">
          {{ tab.label }}
        </button>
      </div>

      <div class="bg-white border-2 border-gray-900 shadow-brutal">
        <div v-if="storeMessage" class="p-4 font-bold text-sm border-b-2 border-gray-200" :class="storeMessageType === 'error' ? 'bg-red-50 text-red-600 border-red-600' : 'bg-green-50 text-green-700 border-green-600'">
          {{ storeMessage }}
        </div>

        <PendingTab v-if="activeTab === 'pending'" :tools="pendingTools" @approve="approveTool" @reject="rejectTool" />
        <SiteContentTab v-if="activeTab === 'content'" :items="siteContent" @save="saveSiteContent" />
        <MarketingTab v-if="activeTab === 'marketing'" :cards="marketingCards" @save="saveMarketingCard" @delete="deleteMarketingCard" @add="addMarketingCard" />
        <FiltersTab v-if="activeTab === 'filters'" :options="filterOptions" @save="saveFilterOption" @delete="deleteFilterOption" @add="addFilterOption" />
        <CategoriesTab v-if="activeTab === 'categories'" :categories="categories" @save="saveCategory" />
        <LegalTab v-if="activeTab === 'legal'" :pages="legalPages" @save="saveLegalPage" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import PendingTab from './admin/PendingTab.vue';
import SiteContentTab from './admin/SiteContentTab.vue';
import MarketingTab from './admin/MarketingTab.vue';
import FiltersTab from './admin/FiltersTab.vue';
import CategoriesTab from './admin/CategoriesTab.vue';
import LegalTab from './admin/LegalTab.vue';

const props = defineProps({ initialLoggedIn: Boolean });
const loggedIn = ref(props.initialLoggedIn);
const password = ref('');
const isLoggingIn = ref(false);
const loginError = ref('');
const isRebuilding = ref(false);
const rebuildMessage = ref('');
const activeTab = ref('pending');
const storeMessage = ref('');
const storeMessageType = ref('success');

const pendingTools = ref([]);
const siteContent = ref([]);
const marketingCards = ref([]);
const filterOptions = ref([]);
const categories = ref([]);
const legalPages = ref([]);

const tabs = [
  { key: 'pending', label: 'Pending' },
  { key: 'content', label: 'Site Content' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'filters', label: 'Filters' },
  { key: 'categories', label: 'Categories' },
  { key: 'legal', label: 'Legal Pages' },
];

const pendingCount = computed(() => pendingTools.value.length);

onMounted(() => {
  if (loggedIn.value) fetchAll();
});

const showMessage = (msg, type = 'success') => {
  storeMessage.value = msg;
  storeMessageType.value = type;
  setTimeout(() => { storeMessage.value = ''; }, 4000);
};

const login = async () => {
  isLoggingIn.value = true;
  loginError.value = '';
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value })
    });
    if (res.ok) {
      loggedIn.value = true;
      password.value = '';
      fetchAll();
    } else {
      const data = await res.json();
      loginError.value = data.error || 'Login failed';
    }
  } catch {
    loginError.value = 'Network error';
  } finally {
    isLoggingIn.value = false;
  }
};

const logout = async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  loggedIn.value = false;
};

const fetchAll = async () => {
  const [pendingRes, contentRes, marketingRes, filtersRes, categoriesRes, legalRes] = await Promise.all([
    fetch('/api/admin/list'),
    fetch('/api/admin/content'),
    fetch('/api/admin/marketing'),
    fetch('/api/admin/filters'),
    fetch('/api/admin/categories'),
    fetch('/api/admin/legal'),
  ]);
  if (pendingRes.status === 401) { loggedIn.value = false; return; }
  const pData = await pendingRes.json();
  pendingTools.value = pData.tools || [];
  if (contentRes.ok) { const d = await contentRes.json(); siteContent.value = d.content || []; }
  if (marketingRes.ok) { const d = await marketingRes.json(); marketingCards.value = d.cards || []; }
  if (filtersRes.ok) { const d = await filtersRes.json(); filterOptions.value = d.options || []; }
  if (categoriesRes.ok) { const d = await categoriesRes.json(); categories.value = d.categories || []; }
  if (legalRes.ok) { const d = await legalRes.json(); legalPages.value = d.pages || []; }
};

const approveTool = async (id) => {
  try {
    const res = await fetch(`/api/admin/tools/${id}/approve`, { method: 'POST' });
    if (res.ok) {
      pendingTools.value = pendingTools.value.filter(t => t.id !== id);
      showMessage('Tool approved successfully');
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error approving tool', 'error'); }
};

const rejectTool = async (id) => {
  try {
    const res = await fetch(`/api/admin/tools/${id}/reject`, { method: 'POST' });
    if (res.ok) {
      pendingTools.value = pendingTools.value.filter(t => t.id !== id);
      showMessage('Tool rejected');
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error rejecting tool', 'error'); }
};

const saveSiteContent = async (key, value) => {
  try {
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    if (res.ok) {
      showMessage(`Saved: ${key}`);
      const idx = siteContent.value.findIndex(c => c.key === key);
      if (idx >= 0) siteContent.value[idx].value = value;
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error saving content', 'error'); }
};

const saveMarketingCard = async (card) => {
  try {
    const res = await fetch('/api/admin/marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card)
    });
    if (res.ok) {
      showMessage(card.id ? 'Card updated' : 'Card created');
      fetchAll();
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error saving card', 'error'); }
};

const addMarketingCard = async () => {
  marketingCards.value.push({ type: 'featured', label: '', title: '', description: '', cta: '', url: '', logo: '', sort_order: 0, active: 1, _editing: true, _new: true });
};

const deleteMarketingCard = async (id) => {
  try {
    const res = await fetch(`/api/admin/marketing?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      marketingCards.value = marketingCards.value.filter(c => c.id !== id);
      showMessage('Card deleted');
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error deleting card', 'error'); }
};

const saveFilterOption = async (opt) => {
  try {
    const res = await fetch('/api/admin/filters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opt)
    });
    if (res.ok) {
      showMessage(opt.id ? 'Filter updated' : 'Filter created');
      fetchAll();
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error saving filter', 'error'); }
};

const addFilterOption = async () => {
  filterOptions.value.push({ group_key: '', value: '', label: '', sort_order: 0, active: 1, _editing: true, _new: true });
};

const deleteFilterOption = async (id) => {
  try {
    const res = await fetch(`/api/admin/filters?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      filterOptions.value = filterOptions.value.filter(o => o.id !== id);
      showMessage('Filter deleted');
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error deleting filter', 'error'); }
};

const saveCategory = async (slug, data) => {
  try {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_slug: slug, ...data })
    });
    if (res.ok) {
      showMessage(`Saved category: ${slug}`);
      fetchAll();
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error saving category', 'error'); }
};

const saveLegalPage = async (slug, data) => {
  try {
    const res = await fetch('/api/admin/legal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, ...data })
    });
    if (res.ok) {
      showMessage(`Saved page: ${slug}`);
      fetchAll();
    } else { const d = await res.json(); showMessage(`Error: ${d.error}`, 'error'); }
  } catch { showMessage('Network error saving legal page', 'error'); }
};

const rebuild = async () => {
  isRebuilding.value = true;
  rebuildMessage.value = '';
  try {
    const res = await fetch('/api/admin/rebuild', { method: 'POST' });
    if (res.ok) rebuildMessage.value = "Successfully triggered Cloudflare Pages build!";
    else { const d = await res.json(); rebuildMessage.value = `Error: ${d.error}`; }
  } catch { rebuildMessage.value = "Error triggering build."; }
  finally { isRebuilding.value = false; }
};
</script>
