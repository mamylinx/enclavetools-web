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

      <div class="bg-gray-50 border border-gray-200 p-6">
        <h3 class="text-xl font-black text-gray-900 mb-2 uppercase tracking-wide">Have a GitHub Repo?</h3>
        <p class="text-base font-bold text-gray-600 mb-6 m-0">Paste the URL below to automatically fill in most of the details.</p>
        <div class="flex flex-col md:flex-row gap-4">
          <input type="url" v-model="githubUrl" id="githubUrl" class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            placeholder="https://github.com/owner/repo" />
          <button type="button" @click="fetchGithubData" :disabled="isFetching" class="inline-flex items-center justify-center px-6 py-3 font-black uppercase tracking-wider text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500 whitespace-nowrap">
            {{ isFetching ? 'Fetching...' : 'Auto-fill' }}
          </button>
        </div>
        <p v-if="fetchError" class="text-sm font-bold text-red-600 mt-3 m-0">{{ fetchError }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
          <label for="name" class="font-black text-gray-900 uppercase tracking-wider text-sm">Name *</label>
          <input type="text" id="name" v-model="form.name" required class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
        </div>

        <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
          <label for="description" class="font-black text-gray-900 uppercase tracking-wider text-sm">Short Description *</label>
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
            <option v-for="cat in categoryOptions" :key="cat.category" :value="cat.category">{{ cat.title }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label for="license" class="font-black text-gray-900 uppercase tracking-wider text-sm">License</label>
          <input type="text" id="license" v-model="form.license" placeholder="e.g. MIT, Apache 2.0"
            class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label for="maturity" class="font-black text-gray-900 uppercase tracking-wider text-sm">Maturity</label>
          <select id="maturity" v-model="form.maturity" class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors cursor-pointer appearance-none">
            <option value="">Select maturity</option>
            <option value="stable">Stable</option>
            <option value="beta">Beta</option>
            <option value="alpha">Alpha</option>
            <option value="prototype">Prototype</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Hardware *</label>
          <div class="flex flex-col gap-3 bg-white border border-gray-200 p-4">
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.hardware" value="CPU Only" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> CPU Only</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.hardware" value="NVIDIA GPU (CUDA)" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> NVIDIA GPU (CUDA)</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.hardware" value="AMD GPU (ROCm)" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> AMD GPU (ROCm)</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.hardware" value="Apple Silicon (Metal)" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> Apple Silicon (Metal)</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.hardware" value="Low-resource (< 8GB RAM)" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> Low-resource (&lt; 8GB RAM)</label>
          </div>
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Deployment *</label>
          <div class="flex flex-col gap-3 bg-white border border-gray-200 p-4">
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.deployment" value="Docker" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> Docker</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.deployment" value="Bare Metal" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> Bare Metal</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.deployment" value="Kubernetes" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> Kubernetes</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.deployment" value="Systemd / Linux Service" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> Systemd / Linux Service</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.deployment" value="Embedded / Edge" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> Embedded / Edge</label>
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
              <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.modelFormat" value="GGUF" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> GGUF</label>
              <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.modelFormat" value="GPTQ" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> GPTQ</label>
              <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.modelFormat" value="AWQ" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> AWQ</label>
              <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.modelFormat" value="Safetensors" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> Safetensors</label>
              <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.modelFormat" value="ONNX" class="w-5 h-5 border-2 border-gray-900 cursor-pointer accent-gray-900"> ONNX</label>
            </div>
          </div>
        </Transition>

        <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Custom Logo (Optional)</label>
          <div class="flex items-center gap-6 mt-2">
            <img v-if="logoPreview || form.githubAvatarUrl" :src="logoPreview || form.githubAvatarUrl"
              class="w-16 h-16 object-cover border-2 border-gray-900" />
            <div v-else class="w-16 h-16 bg-gray-50 border-2 border-dashed border-gray-400 flex items-center justify-center font-bold text-gray-400 text-xs uppercase">Img</div>
            <input type="file" ref="logoInput" accept="image/png, image/jpeg" @change="handleLogoChange"
              class="text-sm font-bold text-gray-600 file:mr-4 file:py-3 file:px-6 file:border-2 file:border-gray-900 file:text-sm file:font-black file:uppercase file:tracking-wider file:bg-white file:text-gray-900 hover:file:bg-gray-900 hover:file:text-white file:transition-colors file:cursor-pointer file:cursor-pointer" />
          </div>
          <p v-if="fileError" class="text-sm font-bold text-red-600 mt-2 m-0">{{ fileError }}</p>
        </div>
      </div>

      <!-- Advanced Fields -->
      <button type="button" @click="showAdvanced = !showAdvanced"
        class="self-start inline-flex items-center gap-2 px-6 py-3 font-black uppercase tracking-wider text-sm transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">
        {{ showAdvanced ? '▾' : '▸' }} Advanced Fields
      </button>

      <div v-if="showAdvanced" class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 border border-gray-200">
        <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
          <label for="plain_desc" class="font-black text-gray-900 uppercase tracking-wider text-sm">Plain Description</label>
          <textarea id="plain_desc" v-model="form.plain_description" rows="2" placeholder="Simple, non-technical description of what this tool does"
            class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"></textarea>
        </div>

        <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
          <label for="tech_desc" class="font-black text-gray-900 uppercase tracking-wider text-sm">Technical Description</label>
          <textarea id="tech_desc" v-model="form.technical_description" rows="2" placeholder="Detailed technical description for power users"
            class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"></textarea>
        </div>

        <div class="flex flex-col gap-2">
          <label for="setup_diff" class="font-black text-gray-900 uppercase tracking-wider text-sm">Setup Difficulty</label>
          <select id="setup_diff" v-model="form.setup_difficulty" class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors cursor-pointer appearance-none">
            <option value="">Select difficulty</option>
            <option value="very_easy">Very Easy</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="difficult">Difficult</option>
            <option value="very_difficult">Very Difficult</option>
          </select>
        </div>

        <div class="flex flex-col gap-2">
          <label for="comm_use" class="font-black text-gray-900 uppercase tracking-wider text-sm">Commercial Use</label>
          <select id="comm_use" v-model="form.commercial_use" class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors cursor-pointer appearance-none">
            <option value="">Not specified</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="requires_license">Requires License</option>
          </select>
        </div>

        <div class="flex flex-col gap-2">
          <label for="telemetry" class="font-black text-gray-900 uppercase tracking-wider text-sm">Telemetry</label>
          <select id="telemetry" v-model="form.telemetry" class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors cursor-pointer appearance-none">
            <option value="">Not specified</option>
            <option value="none">None</option>
            <option value="opt_in">Opt-in</option>
            <option value="opt_out">Opt-out</option>
            <option value="always">Always</option>
          </select>
        </div>

        <div class="flex flex-col gap-2">
          <label for="offline" class="font-black text-gray-900 uppercase tracking-wider text-sm">Works Offline After Setup</label>
          <select id="offline" v-model="form.offline_after_setup" class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors cursor-pointer appearance-none">
            <option value="">Not specified</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Capabilities</label>
          <div class="flex flex-col gap-3 bg-white border border-gray-200 p-4">
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.openai_api" value="yes" class="w-5 h-5 accent-gray-900 cursor-pointer"> OpenAI API Compatible</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.rest_api" value="yes" class="w-5 h-5 accent-gray-900 cursor-pointer"> REST API</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.docker_available" value="yes" class="w-5 h-5 accent-gray-900 cursor-pointer"> Docker Available</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.gui_available" value="yes" class="w-5 h-5 accent-gray-900 cursor-pointer"> GUI Available</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.paid_support" value="yes" class="w-5 h-5 accent-gray-900 cursor-pointer"> Paid Support</label>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Model Features</label>
          <div class="flex flex-col gap-3 bg-white border border-gray-200 p-4">
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.fine_tuning" value="yes" class="w-5 h-5 accent-gray-900 cursor-pointer"> Fine-tuning</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.quantization" value="yes" class="w-5 h-5 accent-gray-900 cursor-pointer"> Quantization</label>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label for="doc_url" class="font-black text-gray-900 uppercase tracking-wider text-sm">Documentation URL</label>
          <input type="url" id="doc_url" v-model="form.docs_url" placeholder="https://docs.example.com"
            class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
        </div>

        <div class="flex flex-col gap-2">
          <label for="min_ram" class="font-black text-gray-900 uppercase tracking-wider text-sm">Min RAM (GB)</label>
          <input type="number" id="min_ram" v-model="form.min_ram_gb" placeholder="e.g. 8" min="0" step="1"
            class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
        </div>

        <div class="flex flex-col gap-2">
          <label for="rec_ram" class="font-black text-gray-900 uppercase tracking-wider text-sm">Recommended RAM (GB)</label>
          <input type="number" id="rec_ram" v-model="form.recommended_ram_gb" placeholder="e.g. 16" min="0" step="1"
            class="w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
        </div>

        <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Use Cases</label>
          <div class="flex flex-row flex-wrap gap-x-6 gap-y-3 bg-white border border-gray-200 p-4">
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.use_cases" value="chat" class="w-5 h-5 accent-gray-900 cursor-pointer"> Chat</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.use_cases" value="code_generation" class="w-5 h-5 accent-gray-900 cursor-pointer"> Code Generation</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.use_cases" value="image_generation" class="w-5 h-5 accent-gray-900 cursor-pointer"> Image Generation</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.use_cases" value="audio_transcription" class="w-5 h-5 accent-gray-900 cursor-pointer"> Audio Transcription</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.use_cases" value="translation" class="w-5 h-5 accent-gray-900 cursor-pointer"> Translation</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.use_cases" value="classification" class="w-5 h-5 accent-gray-900 cursor-pointer"> Classification</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.use_cases" value="embedding" class="w-5 h-5 accent-gray-900 cursor-pointer"> Embedding</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.use_cases" value="data_extraction" class="w-5 h-5 accent-gray-900 cursor-pointer"> Data Extraction</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.use_cases" value="agent" class="w-5 h-5 accent-gray-900 cursor-pointer"> Agent / Automation</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.use_cases" value="other" class="w-5 h-5 accent-gray-900 cursor-pointer"> Other</label>
          </div>
        </div>

        <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
          <label class="font-black text-gray-900 uppercase tracking-wider text-sm">Target Personas</label>
          <div class="flex flex-row flex-wrap gap-x-6 gap-y-3 bg-white border border-gray-200 p-4">
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.personas" value="developer" class="w-5 h-5 accent-gray-900 cursor-pointer"> Developer</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.personas" value="data_scientist" class="w-5 h-5 accent-gray-900 cursor-pointer"> Data Scientist</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.personas" value="researcher" class="w-5 h-5 accent-gray-900 cursor-pointer"> Researcher</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.personas" value="hobbyist" class="w-5 h-5 accent-gray-900 cursor-pointer"> Hobbyist</label>
            <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer"><input type="checkbox" v-model="form.personas" value="enterprise" class="w-5 h-5 accent-gray-900 cursor-pointer"> Enterprise</label>
          </div>
        </div>
      </div>

      <div v-if="submitError" class="bg-red-50 text-red-600 border border-red-600 p-4 font-bold text-sm">
        {{ submitError }}
      </div>

      <div class="flex justify-end mt-4">
        <button type="submit" :disabled="isSubmitting" class="inline-flex items-center justify-center px-6 py-3 font-black uppercase tracking-wider text-sm transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-primary-500">
          {{ isSubmitting ? 'Submitting...' : 'Submit Tool' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import categories from '../data/categories.json';

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
const showAdvanced = ref(false);

const categoryOptions = computed(() => categories.filter(c => c.category !== 'all'));

const form = ref({
  name: '',
  description: '',
  url: '',
  githubUrl: '',
  category: '',
  license: '',
  maturity: '',
  githubAvatarUrl: '',
  hardware: [],
  deployment: [],
  modelFormat: [],
  plain_description: '',
  technical_description: '',
  setup_difficulty: '',
  commercial_use: '',
  telemetry: '',
  offline_after_setup: '',
  openai_api: '',
  rest_api: '',
  docker_available: '',
  gui_available: '',
  paid_support: '',
  fine_tuning: '',
  quantization: '',
  docs_url: '',
  min_ram_gb: '',
  recommended_ram_gb: '',
  use_cases: [],
  personas: [],
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
    if (form.value.maturity) formData.append('maturity', form.value.maturity);

    if (githubDataStr.value) formData.append('github_data', githubDataStr.value);

    formData.append('hardware', JSON.stringify(form.value.hardware));
    formData.append('deployment', JSON.stringify(form.value.deployment));
    if (form.value.category === 'llm-models') {
      formData.append('model_format', JSON.stringify(form.value.modelFormat));
    }

    if (form.value.plain_description) formData.append('plain_description', form.value.plain_description);
    if (form.value.technical_description) formData.append('technical_description', form.value.technical_description);
    if (form.value.setup_difficulty) formData.append('setup_difficulty', form.value.setup_difficulty);
    if (form.value.commercial_use) formData.append('commercial_use', form.value.commercial_use);
    if (form.value.telemetry) formData.append('telemetry', form.value.telemetry);
    if (form.value.offline_after_setup) formData.append('offline_after_setup', form.value.offline_after_setup);
    if (form.value.openai_api) formData.append('openai_api', form.value.openai_api);
    if (form.value.rest_api) formData.append('rest_api', form.value.rest_api);
    if (form.value.docker_available) formData.append('docker_available', form.value.docker_available);
    if (form.value.gui_available) formData.append('gui_available', form.value.gui_available);
    if (form.value.paid_support) formData.append('paid_support', form.value.paid_support);
    if (form.value.fine_tuning) formData.append('fine_tuning', form.value.fine_tuning);
    if (form.value.quantization) formData.append('quantization', form.value.quantization);
    if (form.value.docs_url) formData.append('docs_url', form.value.docs_url);
    if (form.value.min_ram_gb) formData.append('min_ram_gb', form.value.min_ram_gb);
    if (form.value.recommended_ram_gb) formData.append('recommended_ram_gb', form.value.recommended_ram_gb);

    if (form.value.use_cases.length > 0) {
      formData.append('use_cases', JSON.stringify(form.value.use_cases));
    }
    if (form.value.personas.length > 0) {
      formData.append('personas', JSON.stringify(form.value.personas));
    }

    if (logoFile.value) formData.append('logo', logoFile.value);

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
