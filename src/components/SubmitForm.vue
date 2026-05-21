<template>
  <div>
    <div v-if="success" class="success-message">
      <div class="success-icon">✓</div>
      <div>
        <h3>Successfully submitted</h3>
        <p>Your tool has been submitted and is pending review by the admin.</p>
      </div>
    </div>

    <form v-else @submit.prevent="submitForm" class="custom-form">
      
      <!-- GitHub Autofill -->
      <div class="github-section">
        <h3>Have a GitHub Repo?</h3>
        <p>Paste the URL below to automatically fill in most of the details.</p>
        <div class="github-input-group">
          <input type="url" v-model="githubUrl" id="githubUrl" class="custom-input" placeholder="https://github.com/owner/repo" />
          <button type="button" @click="fetchGithubData" :disabled="isFetching" class="custom-btn secondary">
            {{ isFetching ? 'Fetching...' : 'Auto-fill' }}
          </button>
        </div>
        <p v-if="fetchError" class="error-text">{{ fetchError }}</p>
      </div>

      <!-- Core Fields -->
      <div class="form-grid">
        <div class="form-group full-width">
          <label for="name">Name *</label>
          <input type="text" id="name" v-model="form.name" required class="custom-input" />
        </div>

        <div class="form-group full-width">
          <label for="description">Description *</label>
          <textarea id="description" v-model="form.description" rows="3" required class="custom-input"></textarea>
        </div>

        <div class="form-group half-width">
          <label for="url">Website URL</label>
          <input type="url" id="url" v-model="form.url" class="custom-input" />
        </div>

        <div class="form-group half-width">
          <label for="category">Category *</label>
          <select id="category" v-model="form.category" required class="custom-input">
            <option value="">Select a category</option>
            <option value="llm-inference">LLM Inference</option>
            <option value="llm-models">LLM Models</option>
            <option value="vector-databases">Vector Databases</option>
            <option value="agent-frameworks">Agent Frameworks</option>
            <option value="image-generation">Image Generation</option>
            <option value="audio-video">Audio / Video</option>
            <option value="developer-tools">Developer Tools</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="form-group full-width">
          <label for="license">License</label>
          <input type="text" id="license" v-model="form.license" placeholder="e.g. MIT, Apache 2.0" class="custom-input" />
        </div>

        <!-- Custom Logo -->
        <div class="form-group full-width">
          <label>Custom Logo (Optional)</label>
          <div class="logo-upload">
            <img v-if="logoPreview || form.githubAvatarUrl" :src="logoPreview || form.githubAvatarUrl" class="logo-preview" />
            <div v-else class="logo-placeholder">Img</div>
            <input type="file" ref="logoInput" accept="image/png, image/jpeg" @change="handleLogoChange" class="file-input" />
          </div>
        </div>
      </div>

      <div v-if="submitError" class="error-message">
        {{ submitError }}
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="isSubmitting" class="custom-btn primary">
          {{ isSubmitting ? 'Submitting...' : 'Submit Tool' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const githubUrl = ref('');
const isFetching = ref(false);
const fetchError = ref('');

const isSubmitting = ref(false);
const submitError = ref('');
const success = ref(false);

const logoInput = ref(null);
const logoFile = ref(null);
const logoPreview = ref('');
const githubDataStr = ref('');

const form = ref({
  name: '',
  description: '',
  url: '',
  githubUrl: '',
  category: '',
  license: '',
  githubAvatarUrl: ''
});

const handleLogoChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) {
    alert("File is too large. Max 1MB.");
    e.target.value = '';
    return;
  }
  logoFile.value = file;
  logoPreview.value = URL.createObjectURL(file);
};

const fetchGithubData = async () => {
  if (!githubUrl.value) return;
  isFetching.value = true;
  fetchError.value = '';
  
  try {
    const res = await fetch(`/api/github/fetch?url=${encodeURIComponent(githubUrl.value)}`);
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Failed to fetch');
    
    form.value.name = data.name || form.value.name;
    form.value.description = data.description || form.value.description;
    form.value.license = data.license || form.value.license;
    form.value.githubUrl = githubUrl.value;
    form.value.githubAvatarUrl = data.avatar_url || '';
    
    // Store raw data to send to server
    githubDataStr.value = JSON.stringify(data.raw);
    
  } catch (err) {
    fetchError.value = err.message;
  } finally {
    isFetching.value = false;
  }
};

const submitForm = async () => {
  isSubmitting.value = true;
  submitError.value = '';
  
  try {
    const formData = new FormData();
    formData.append('name', form.value.name);
    formData.append('description', form.value.description);
    formData.append('url', form.value.url);
    if (form.value.githubUrl) formData.append('github_url', form.value.githubUrl);
    formData.append('category', form.value.category);
    if (form.value.license) formData.append('license', form.value.license);
    if (githubDataStr.value) formData.append('github_data', githubDataStr.value);
    
    if (logoFile.value) {
      formData.append('logo', logoFile.value);
    }
    
    const res = await fetch('/api/submit', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit');
    
    success.value = true;
  } catch (err) {
    submitError.value = err.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.custom-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.github-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 20px;
}

.github-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.github-section p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.github-input-group {
  display: flex;
  gap: 12px;
}

@media (max-width: 480px) {
  .github-input-group {
    flex-direction: column;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.full-width {
  grid-column: 1 / -1;
}

.half-width {
  grid-column: span 1;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .half-width {
    grid-column: 1 / -1;
  }
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

.logo-upload {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-preview {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 1px solid var(--border-light);
}

.logo-placeholder {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px dashed var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.file-input {
  font-size: 13px;
  color: var(--text-secondary);
}

.file-input::file-selector-button {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-right: 12px;
  transition: all 0.15s;
}

.file-input::file-selector-button:hover {
  background: var(--border-light);
}

.custom-btn {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font);
  font-size: 14px;
  font-weight: 500;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.error-text {
  font-size: 13px;
  color: var(--red-text);
  margin-top: 8px;
}

.error-message {
  background: var(--red-bg);
  color: var(--red-text);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--green-bg);
  color: var(--green-text);
  padding: 20px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
}

.success-icon {
  width: 32px;
  height: 32px;
  background: var(--white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
}

.success-message h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.success-message p {
  font-size: 13px;
}
</style>
