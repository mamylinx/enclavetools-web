<template>
  <div>
    <!-- Login Form -->
    <div v-if="!loggedIn" class="max-w-[400px] mx-auto bg-gray-50 border-2 border-gray-900 p-8 shadow-[4px_4px_0_0_rgba(17,24,39,1)]">
      <h2 class="text-xl font-black text-gray-900 mb-6 text-center uppercase tracking-wide">Admin Login</h2>
      <form @submit.prevent="login" class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Password</label>
          <input type="password" v-model="password" required class="w-full bg-white border-2 border-gray-900 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-none transition-colors" />
        </div>
        <p v-if="loginError" class="text-sm font-bold text-red-600 m-0">{{ loginError }}</p>
        <button type="submit" class="w-full inline-flex items-center justify-center px-6 py-3 font-black uppercase tracking-wider text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-primary-500 border-none rounded-none mt-2" :disabled="isLoggingIn">
          {{ isLoggingIn ? 'Logging in...' : 'Sign In' }}
        </button>
      </form>
    </div>

    <!-- Dashboard -->
    <div v-else class="flex flex-col gap-8 max-w-5xl mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-gray-900 pb-6">
        <div class="inline-flex items-center gap-2 bg-primary-50 text-primary-600 border-2 border-primary-500 px-4 py-2 font-black uppercase tracking-widest text-xs">
          <span class="w-2 h-2 bg-primary-500 rounded-full animate-pulse block"></span>
          {{ pendingTools.length }} Pending Submissions
        </div>
        <div class="flex flex-wrap gap-3 w-full md:w-auto">
          <button @click="rebuild" :disabled="isRebuilding" class="flex-1 md:flex-none inline-flex items-center justify-center px-6 py-2.5 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-green-500 text-white hover:bg-green-600 border-2 border-green-700 rounded-none">
            {{ isRebuilding ? 'Triggering Build...' : 'Rebuild Pages' }}
          </button>
          <button @click="logout" class="flex-1 md:flex-none inline-flex items-center justify-center px-6 py-2.5 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none">
            Logout
          </button>
        </div>
      </div>

      <div v-if="rebuildMessage" class="p-4 font-bold text-sm border-2" :class="rebuildMessage.includes('Error') ? 'bg-red-50 text-red-600 border-red-600' : 'bg-green-50 text-green-700 border-green-600'">
        {{ rebuildMessage }}
      </div>

      <div class="bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_rgba(17,24,39,1)] flex flex-col">
        <div v-if="pendingTools.length === 0" class="p-12 text-center text-gray-500 font-bold text-lg border-dashed border-gray-300">
          <p class="m-0">No pending tools to review.</p>
        </div>

        <div v-for="tool in pendingTools" :key="tool.id" class="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b-2 border-gray-200 last:border-b-0 gap-6">
          <div class="flex-1">
            <h4 class="text-xl font-black text-gray-900 mb-2">{{ tool.name }}</h4>
            <p class="text-gray-600 font-medium mb-4 max-w-2xl leading-relaxed m-0">{{ tool.description }}</p>
            <div class="flex flex-wrap gap-3">
              <span class="text-xs font-bold text-gray-700 bg-gray-100 border border-gray-300 px-2 py-1 uppercase tracking-wider">Category: {{ tool.category }}</span>
              <span v-if="tool.github_url" class="text-xs font-bold text-gray-700 bg-gray-100 border border-gray-300 px-2 py-1 uppercase tracking-wider">
                GitHub: <a :href="tool.github_url" target="_blank" class="text-primary-500 hover:text-primary-600 underline">Link</a>
              </span>
            </div>
          </div>
          <div class="flex w-full md:w-auto gap-3 shrink-0">
            <button @click="rejectTool(tool.id)" class="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border-2 border-red-200 hover:border-red-600 rounded-none">Reject</button>
            <button @click="approveTool(tool.id)" class="flex-1 md:flex-none inline-flex items-center justify-center px-6 py-2 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer bg-gray-900 text-white hover:bg-primary-500 border-none rounded-none">Approve</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  initialLoggedIn: Boolean
});

const loggedIn = ref(props.initialLoggedIn);
const password = ref('');
const isLoggingIn = ref(false);
const loginError = ref('');

const pendingTools = ref([]);
const isRebuilding = ref(false);
const rebuildMessage = ref('');

onMounted(() => {
  if (loggedIn.value) fetchTools();
});

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
      fetchTools();
    } else {
      const data = await res.json();
      loginError.value = data.error || 'Login failed';
    }
  } catch (err) {
    loginError.value = 'Network error';
  } finally {
    isLoggingIn.value = false;
  }
};

const logout = async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  loggedIn.value = false;
  password.value = '';
};

const fetchTools = async () => {
  try {
    const res = await fetch('/api/admin/list');
    if (res.status === 401) {
      loggedIn.value = false;
      return;
    }
    const data = await res.json();
    pendingTools.value = data.tools || [];
  } catch (err) {
    console.error(err);
  }
};

const approveTool = async (id) => {
  try {
    const res = await fetch(`/api/admin/tools/${id}/approve`, { method: 'POST' });
    if (res.ok) {
      pendingTools.value = pendingTools.value.filter(t => t.id !== id);
    }
  } catch (err) {
    console.error(err);
  }
};

const rejectTool = async (id) => {
  try {
    const res = await fetch(`/api/admin/tools/${id}/reject`, { method: 'POST' });
    if (res.ok) {
      pendingTools.value = pendingTools.value.filter(t => t.id !== id);
    }
  } catch (err) {
    console.error(err);
  }
};

const rebuild = async () => {
  isRebuilding.value = true;
  rebuildMessage.value = '';

  try {
    const res = await fetch('/api/admin/rebuild', { method: 'POST' });
    if (res.ok) {
      rebuildMessage.value = "Successfully triggered Cloudflare Pages build!";
    } else {
      const data = await res.json();
      rebuildMessage.value = `Error: ${data.error}`;
    }
  } catch (err) {
    rebuildMessage.value = "Error triggering build.";
  } finally {
    isRebuilding.value = false;
  }
};
</script>


