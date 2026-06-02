<template>
  <div>
    <div v-if="success" class="flex flex-col md:flex-row items-start md:items-center gap-6 bg-green-50 border border-green-600 p-6 mb-8">
      <div class="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-black shrink-0">✓</div>
      <div>
        <h3 class="text-xl font-black text-green-800 mb-2">Successfully submitted</h3>
        <p class="text-green-700 font-bold m-0">Your tool has been submitted and is pending review by the admin.</p>
      </div>
    </div>

    <form v-else @submit.prevent="submitForm" class="flex flex-col gap-6">

      <!-- GitHub Autofill -->
      <div class="bg-gray-50 border border-gray-200 p-6">
        <h3 class="text-xl font-black text-gray-900 mb-2 uppercase tracking-wide">Have a GitHub Repo?</h3>
        <p class="text-base font-bold text-gray-600 mb-6 m-0">Paste the URL below to automatically fill in most of the details.</p>
        <div class="flex flex-col md:flex-row gap-4">
          <input type="url" v-model="githubUrl" id="githubUrl" class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            placeholder="https://github.com/owner/repo" />
          <button type="button" @click="fetchGithubData" :disabled="isFetching" class="inline-flex items-center justify-center px-6 py-3 font-black uppercase tracking-wider text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-200 text-gray-900 hover:bg-gray-900 hover:text-white whitespace-nowrap">
            {{ isFetching ? 'Fetching...' : 'Auto-fill' }}
          </button>
        </div>
        <p v-if="fetchError" class="text-sm font-bold text-red-600 mt-3 m-0">{{ fetchError }}</p>
      </div>

      <!-- Core Fields -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
          <label for="name" class="font-black text-gray-900 uppercase tracking-wider text-sm">Name *</label>
          <input type="text" id="name" v-model="form.name" required class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
        </div>

        <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
          <label for="description" class="font-black text-gray-900 uppercase tracking-wider text-sm">Description *</label>
          <textarea id="description" v-model="form.description" rows="3" required class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"></textarea>
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label for="url" class="font-black text-gray-900 uppercase tracking-wider text-sm">Website URL</label>
          <input type="url" id="url" v-model="form.url" class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label for="category" class="font-black text-gray-900 uppercase tracking-wider text-sm">Category *</label>
          <select id="category" v-model="form.category" required class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors cursor-pointer appearance-none">
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

        <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
          <label for="license" class="font-black text-gray-900 uppercase tracking-wider text-sm">License</label>
          <input type="text" id="license" v-model="form.license" placeholder="e.g. MIT, Apache 2.0"
            class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Hardware *</label>
          <div class="flex flex-col gap-3 bg-white border border-gray-200 p-4">
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.hardware" value="CPU Only" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> CPU Only</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.hardware" value="NVIDIA GPU (CUDA)" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> NVIDIA GPU (CUDA)</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.hardware" value="AMD GPU (ROCm)" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> AMD GPU (ROCm)</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.hardware" value="Apple Silicon (Metal)" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> Apple Silicon (Metal)</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.hardware" value="Low-resource (< 8GB RAM)" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> Low-resource (&lt; 8GB RAM)</label>
          </div>
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Deployment *</label>
          <div class="flex flex-col gap-3 bg-white border border-gray-200 p-4">
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.deployment" value="Docker" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> Docker</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.deployment" value="Bare Metal" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> Bare Metal</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.deployment" value="Kubernetes" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> Kubernetes</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.deployment" value="Systemd / Linux Service" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> Systemd / Linux Service</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.deployment" value="Embedded / Edge" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> Embedded / Edge</label>
          </div>
        </div>

        <Transition 
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2.5"
          leave-active-class="transition-all duration-300 ease-out"
          leave-to-class="opacity-0 -translate-y-2.5"
        >
          <div v-if="form.category === 'llm-models'" class="flex flex-col gap-2 col-span-1 md:col-span-2">
            <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Model Format *</label>
            <div class="flex flex-row flex-wrap gap-6 bg-white border border-gray-200 p-4">
              <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.modelFormat" value="GGUF" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> GGUF</label>
              <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.modelFormat" value="GPTQ" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> GPTQ</label>
              <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.modelFormat" value="AWQ" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> AWQ</label>
              <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.modelFormat" value="Safetensors" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> Safetensors</label>
              <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.modelFormat" value="ONNX" class="w-5 h-5 border-2 border-gray-900  cursor-pointer accent-gray-900"> ONNX</label>
            </div>
          </div>
        </Transition>

        <!-- Custom Logo -->
        <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Custom Logo (Optional)</label>
          <div class="flex items-center gap-6 mt-2">
            <img v-if="logoPreview || form.githubAvatarUrl" :src="logoPreview || form.githubAvatarUrl"
              class="w-16 h-16 object-cover border-2 border-gray-900" />
            <div v-else class="w-16 h-16 bg-gray-50 border-2 border-dashed border-gray-400 flex items-center justify-center font-bold text-gray-400 text-xs uppercase">Img</div>
            <input type="file" ref="logoInput" accept="image/png, image/jpeg" @change="handleLogoChange"
              class="text-sm font-bold text-gray-600 file:mr-4 file:py-3 file:px-6 file:border-2 file:border-gray-900 file:text-sm file:font-black file:uppercase file:tracking-wider file:bg-white file:text-gray-900 hover:file:bg-gray-900 hover:file:text-white file:transition-colors file:cursor-pointer file: cursor-pointer" />
          </div>
          <p v-if="fileError" class="text-sm font-bold text-red-600 mt-2 m-0">{{ fileError }}</p>
        </div>
      </div>

      <div v-if="submitError" class="bg-red-50 text-red-600 border border-red-600 p-4 font-bold text-sm rounded-full">
        {{ submitError }}
      </div>

      <div class="flex justify-end mt-4">
        <button type="submit" :disabled="isSubmitting" class="inline-flex items-center justify-center px-8 py-4 font-black uppercase tracking-wider text-sm transition-colors border-none cursor-pointer rounded-full disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-primary-500">
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
const fileError = ref('');
const githubDataStr = ref('');

const form = ref({
  name: '',
  description: '',
  url: '',
  githubUrl: '',
  category: '',
  license: '',
  githubAvatarUrl: '',
  hardware: [],
  deployment: [],
  modelFormat: []
});

const handleLogoChange = (e) => {
  fileError.value = '';
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) {
    fileError.value = "File is too large. Max 1MB.";
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

  if (form.value.hardware.length === 0) {
    submitError.value = "Please select at least one hardware option.";
    isSubmitting.value = false;
    return;
  }
  if (form.value.deployment.length === 0) {
    submitError.value = "Please select at least one deployment option.";
    isSubmitting.value = false;
    return;
  }
  if (form.value.category === 'llm-models' && form.value.modelFormat.length === 0) {
    submitError.value = "Please select at least one model format.";
    isSubmitting.value = false;
    return;
  }

  try {
    const formData = new FormData();
    formData.append('name', form.value.name);
    formData.append('description', form.value.description);

    const finalUrl = form.value.url || form.value.githubUrl;
    if (finalUrl) formData.append('url', finalUrl);

    if (form.value.githubUrl) formData.append('github_url', form.value.githubUrl);
    formData.append('category', form.value.category);
    if (form.value.license) formData.append('license', form.value.license);
    if (githubDataStr.value) formData.append('github_data', githubDataStr.value);

    formData.append('hardware', JSON.stringify(form.value.hardware));
    formData.append('deployment', JSON.stringify(form.value.deployment));
    if (form.value.category === 'llm-models') {
      formData.append('model_format', JSON.stringify(form.value.modelFormat));
    }

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
