<template>
  <div>
    <div v-if="success" class="flex flex-col items-center text-center gap-6 py-8">
      <div class="w-20 h-20 bg-green-600 text-white flex items-center justify-center text-4xl font-black border-4 border-green-800 shadow-brutal">✓</div>
      <div>
        <h2 class="text-2xl font-black text-gray-900 mb-3 uppercase tracking-wide">Submitted!</h2>
        <p class="text-gray-600 font-bold max-w-md mx-auto">Your tool is now in our review queue. We'll check it and publish it soon.</p>
      </div>
      <div class="bg-gray-50 border-2 border-gray-200 p-6 text-left w-full max-w-md mt-4">
        <h3 class="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">What happens next</h3>
        <div class="flex flex-col gap-4">
          <div v-for="(step, i) in steps" :key="i" class="flex items-start gap-3">
            <span class="w-8 h-8 bg-gray-900 text-white flex items-center justify-center font-black text-xs shrink-0">{{ i + 1 }}</span>
            <div>
              <p class="font-black text-gray-900 text-sm uppercase tracking-wider">{{ step.title }}</p>
              <p class="text-sm text-gray-600 font-bold">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
      <a href="/" class="inline-flex items-center justify-center px-8 h-12 font-black uppercase tracking-wider text-sm transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500 no-underline">← Back to Browse</a>
    </div>

    <div v-else-if="info" class="flex flex-col gap-6">
      <div class="flex flex-col items-start gap-4 p-6" :class="info.bg">
        <div class="flex items-start gap-4 w-full">
          <span class="text-2xl shrink-0 mt-0.5" :class="info.iconColor">{{ info.icon }}</span>
          <div class="flex-1">
            <h3 class="text-lg font-black mb-1 uppercase tracking-wide" :class="info.titleColor">{{ info.title }}</h3>
            <p class="font-bold text-sm m-0" :class="info.textColor">{{ info.message }}</p>
            <a v-if="info.link" :href="info.link" class="inline-flex items-center gap-1 mt-3 font-black text-sm uppercase tracking-wider underline hover:no-underline">View Tool<svg class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></a>
          </div>
        </div>
      </div>
      <button @click="resetForm" class="self-start inline-flex items-center justify-center px-6 h-12 font-black uppercase tracking-wider text-sm transition-colors cursor-pointer bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500">Submit Another URL</button>
    </div>

    <form v-else @submit.prevent="submitUrl" class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <label for="repoUrl" class="font-black text-gray-900 uppercase tracking-wider text-sm">Tool Repository URL *</label>
        <div class="flex items-center border-2 h-14 px-4 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all duration-150" :class="!url ? 'border-gray-900' : isValid ? 'border-green-500' : 'border-red-500'">
          <span class="w-6 h-6 mr-3 flex items-center justify-center shrink-0" :class="!url || isSubmitting ? 'text-gray-400' : isValid ? 'text-green-600' : 'text-red-500'">{{ !url ? '🔗' : isValid ? '✓' : '✗' }}</span>
          <input type="url" id="repoUrl" v-model="url" @input="validateUrl" placeholder="https://github.com/owner/repo" class="flex-1 h-full bg-transparent border-none outline-none font-bold text-gray-900 placeholder:text-gray-400 text-base p-0 m-0" />
        </div>
        <p v-if="validationMessage" class="mt-2 text-sm font-bold flex items-center gap-2 m-0" :class="isValid ? 'text-green-600' : 'text-red-600'">{{ validationMessage }}</p>
      </div>

      <div class="flex flex-wrap gap-3">
        <span v-for="d in domains" :key="d.host" class="inline-flex items-center px-3 h-8 text-xs font-black uppercase tracking-wider border-2 transition-all duration-150" :class="detected === d.host ? 'bg-primary-100 border-primary-500 text-primary-700' : 'bg-white border-gray-300 text-gray-500'">{{ d.label }}</span>
      </div>

      <div v-if="submitError" class="bg-red-50 text-red-600 border-2 border-red-600 p-4 font-bold text-sm">{{ submitError }}</div>

      <div class="cf-turnstile" :data-sitekey="props.sitekey" data-action="turnstile-spin-v1"></div>
      <p v-if="turnstileError" class="text-sm font-bold text-red-600 m-0">{{ turnstileError }}</p>

      <button type="submit" :disabled="!isValid || isSubmitting" class="w-full h-14 inline-flex items-center justify-center gap-3 font-black uppercase tracking-wider text-base transition-all duration-150 cursor-pointer border-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 text-white border-gray-900 hover:bg-primary-500 hover:border-primary-500">
        <span v-if="isSubmitting" class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block"></span>
        {{ isSubmitting ? 'Submitting...' : 'Submit Tool ' }}<svg v-if="!isSubmitting" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  sitekey: { type: String, required: true },
  workerUrl: { type: String, required: true },
});

const domains = [
  { host: 'github.com', label: 'GitHub' },
  { host: 'huggingface.co', label: 'HuggingFace' },
  { host: 'kaggle.com', label: 'Kaggle' },
  { host: 'bitbucket.org', label: 'Bitbucket' },
  { host: 'gitlab.com', label: 'GitLab' },
];

const steps = [
  { title: 'Review', desc: 'An admin reviews your submission.' },
  { title: 'Approval', desc: "Once approved, it's published to the directory." },
  { title: 'Live', desc: 'Your tool appears in search and filters.' },
];

const url = ref('');
const isValid = ref(false);
const isSubmitting = ref(false);
const submitError = ref('');
const success = ref(false);
const detected = ref('');
const validationMessage = ref('');
const info = ref(null);
const turnstileError = ref('');

const infoStyles = {
  already_listed: {
    bg: 'bg-green-50 border-2 border-green-600',
    titleColor: 'text-green-800',
    textColor: 'text-green-700',
    iconColor: 'text-green-600',
    icon: '✓',
    title: 'Already in Directory',
    msg: 'This tool is already listed in our directory.',
  },
  already_approved: {
    bg: 'bg-green-50 border-2 border-green-600',
    titleColor: 'text-green-800',
    textColor: 'text-green-700',
    iconColor: 'text-green-600',
    icon: '✓',
    title: 'Already Approved',
    msg: 'This URL has already been approved and is in our directory.',
  },
  already_pending: {
    bg: 'bg-yellow-50 border-2 border-yellow-400',
    titleColor: 'text-yellow-800',
    textColor: 'text-yellow-700',
    iconColor: 'text-yellow-600',
    icon: '!',
    title: 'Already Pending Review',
    msg: 'This URL is already in our review queue. No action needed.',
  },
  previously_rejected: {
    bg: 'bg-red-50 border-2 border-red-300',
    titleColor: 'text-red-700',
    textColor: 'text-red-600',
    iconColor: 'text-red-500',
    icon: '!',
    title: 'Previously Rejected',
    msg: '',
  },
};

const validateUrl = () => {
  const input = url.value;
  if (!input) {
    isValid.value = false;
    detected.value = '';
    validationMessage.value = '';
    return;
  }
  try {
    const hostname = new URL(input).hostname.replace(/^www\./, '');
    const match = domains.find(d => hostname === d.host || hostname.endsWith('.' + d.host));
    if (match) {
      isValid.value = true;
      detected.value = match.host;
      validationMessage.value = `✓ ${match.label} repository detected`;
    } else {
      isValid.value = false;
      detected.value = '';
      validationMessage.value = '✗ Unsupported platform. Use GitHub, HuggingFace, Kaggle, Bitbucket, or GitLab.';
    }
  } catch {
    isValid.value = false;
    detected.value = '';
    validationMessage.value = '';
  }
};

const resetForm = () => {
  success.value = false;
  info.value = null;
  url.value = '';
  isValid.value = false;
  detected.value = '';
  validationMessage.value = '';
  submitError.value = '';
};



const submitUrl = async () => {
  isSubmitting.value = true;
  submitError.value = '';
  turnstileError.value = '';
  if (!window.turnstile) {
    turnstileError.value = 'Verification not ready. Please try again.';
    isSubmitting.value = false;
    return;
  }
  const turnstileToken = turnstile.getResponse();
  if (!turnstileToken) {
    turnstileError.value = 'Please complete the verification.';
    isSubmitting.value = false;
    return;
  }
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.value, turnstileToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 403 && data.error === "Turnstile verification failed") {
        turnstile.reset();
        turnstileError.value = 'Verification failed. Please try again.';
        return;
      }
      throw new Error(data.error || 'Submission failed');
    }
    if (data.status === 'success') { success.value = true; return; }
    const style = infoStyles[data.status];
    if (style) {
      info.value = {
        ...style,
        link: data.url || '',
        message: data.status === 'previously_rejected'
          ? (data.explanation ? `Reason: ${data.explanation}` : 'This URL was previously rejected.')
          : style.msg,
      };
    }
  } catch (err) {
    submitError.value = err.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>
