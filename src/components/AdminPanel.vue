<template>
  <div>
    <!-- Login Form -->
    <div v-if="!loggedIn" class="login-card">
      <h2>Admin Login</h2>
      <form @submit.prevent="login" class="custom-form">
        <div class="form-group">
          <label>Password</label>
          <input type="password" v-model="password" required class="custom-input" />
        </div>
        <p v-if="loginError" class="error-text">{{ loginError }}</p>
        <button type="submit" class="custom-btn primary full-width" :disabled="isLoggingIn">
          {{ isLoggingIn ? 'Logging in...' : 'Sign In' }}
        </button>
      </form>
    </div>

    <!-- Dashboard -->
    <div v-else class="dashboard-container">
      <div class="dashboard-header">
        <div class="status-badge">
          <span class="pulse-dot"></span>
          {{ pendingTools.length }} Pending Submissions
        </div>
        <div class="dashboard-actions">
          <button @click="rebuild" :disabled="isRebuilding" class="custom-btn success">
            {{ isRebuilding ? 'Triggering Build...' : 'Rebuild Pages' }}
          </button>
          <button @click="logout" class="custom-btn secondary">
            Logout
          </button>
        </div>
      </div>

      <div v-if="rebuildMessage" :class="['message-banner', rebuildMessage.includes('Error') ? 'error' : 'success']">
        {{ rebuildMessage }}
      </div>

      <div class="submissions-list">
        <div v-if="pendingTools.length === 0" class="empty-list">
          <p>No pending tools to review.</p>
        </div>
        
        <div v-for="tool in pendingTools" :key="tool.id" class="submission-card">
          <div class="sub-info">
            <h4>{{ tool.name }}</h4>
            <p>{{ tool.description }}</p>
            <div class="sub-meta">
              <span class="meta-tag">Category: {{ tool.category }}</span>
              <span v-if="tool.github_url" class="meta-tag">
                GitHub: <a :href="tool.github_url" target="_blank">Link</a>
              </span>
            </div>
          </div>
          <div class="sub-actions">
            <button @click="rejectTool(tool.id)" class="custom-btn danger outline">Reject</button>
            <button @click="approveTool(tool.id)" class="custom-btn primary">Approve</button>
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

<style scoped>
.login-card {
  max-width: 400px;
  margin: 0 auto;
  background: var(--white);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.02);
}

.login-card h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
  text-align: center;
}

.custom-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.custom-input {
  width: 100%;
  background: var(--white);
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 14px;
  outline: none;
  transition: all 0.15s;
}

.custom-input:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
}

.custom-btn {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.custom-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.custom-btn.full-width {
  width: 100%;
}

.custom-btn.primary {
  background: var(--accent-blue);
  color: var(--white);
}

.custom-btn.primary:hover:not(:disabled) {
  background: var(--accent-blue-hover);
}

.custom-btn.secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
}

.custom-btn.secondary:hover:not(:disabled) {
  border-color: var(--text-tertiary);
}

.custom-btn.success {
  background: var(--green-bg);
  color: var(--green-text);
  border: 1px solid #c8e6c9;
}

.custom-btn.success:hover:not(:disabled) {
  background: #c8e6c9;
}

.custom-btn.danger.outline {
  background: transparent;
  color: var(--red-text);
  border: 1px solid #ffcdd2;
}

.custom-btn.danger.outline:hover:not(:disabled) {
  background: var(--red-bg);
}

.error-text {
  font-size: 13px;
  color: var(--red-text);
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-actions {
  display: flex;
  gap: 12px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--blue-bg);
  color: var(--blue-text);
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--accent-blue);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 102, 255, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(0, 102, 255, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 102, 255, 0); }
}

.message-banner {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
}

.message-banner.success {
  background: var(--green-bg);
  color: var(--green-text);
}

.message-banner.error {
  background: var(--red-bg);
  color: var(--red-text);
}

.submissions-list {
  background: var(--white);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.empty-list {
  padding: 40px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
}

.submission-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-light);
}

.submission-card:last-child {
  border-bottom: none;
}

.sub-info h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--accent-blue);
  margin-bottom: 4px;
}

.sub-info p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  max-width: 600px;
}

.sub-meta {
  display: flex;
  gap: 16px;
}

.meta-tag {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.meta-tag a {
  color: var(--accent-blue);
  text-decoration: underline;
}

.sub-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .submission-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .sub-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
