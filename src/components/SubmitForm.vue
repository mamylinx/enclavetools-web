<template>
  <div>
    <div v-if="success" class="flex flex-col items-center text-center gap-6 py-8">
      <div
        class="w-20 h-20 bg-gradient-cool text-white flex items-center justify-center text-4xl font-extrabold rounded-full shadow-lg shadow-accent-green/25">
        ✓</div>
      <div>
        <h2 class="text-2xl font-extrabold text-brand-forest mb-3 uppercase tracking-wide">Submitted!</h2>
        <p class="text-brand-muted font-bold max-w-md mx-auto">Your tool is now in our review queue. We'll check it and
          publish it soon.</p>
      </div>
      <div class="bg-linear-to-br from-brand-tealLight/40 via-white to-accent-yellow/8 backdrop-blur-sm border border-brand-forest/5 shadow-sm shadow-brand-forest/5 rounded-3xl p-6 text-left w-full max-w-md mt-4">
        <h3 class="text-sm font-extrabold text-brand-forest uppercase tracking-wider mb-4">What happens next</h3>
        <div class="flex flex-col gap-4">
          <div v-for="(step, i) in steps" :key="i" class="flex items-start gap-3">
            <span
              class="w-8 h-8 bg-gradient-cool text-white flex items-center justify-center font-extrabold text-xs shrink-0 rounded-full shadow-sm shadow-accent-green/20">{{
              i + 1 }}</span>
            <div>
              <p class="font-extrabold text-brand-forest text-sm uppercase tracking-wider">{{ step.title }}</p>
              <p class="text-sm text-brand-muted font-bold">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
      <a href="/"
        class="inline-flex items-center justify-center px-8 h-12 font-extrabold uppercase tracking-wider text-sm transition-all cursor-pointer bg-white/90 backdrop-blur-sm border border-brand-forest/5 text-brand-forest hover:bg-accent-teal hover:text-white hover:border-accent-teal hover:shadow-md no-underline rounded-full">←
        Back to Browse</a>
    </div>

    <div v-else-if="info" class="flex flex-col gap-6">
      <div class="flex flex-col items-start gap-4 p-6 rounded-3xl backdrop-blur-sm" :class="info.bg">
        <div class="flex items-start gap-4 w-full">
          <span class="text-2xl shrink-0 mt-0.5" :class="info.iconColor">{{ info.icon }}</span>
          <div class="flex-1">
            <h3 class="text-lg font-extrabold mb-1 uppercase tracking-wide" :class="info.titleColor">{{ info.title }}
            </h3>
            <p class="font-bold text-sm m-0" :class="info.textColor">{{ info.message }}</p>
            <a v-if="info.link" :href="info.link"
              class="inline-flex items-center gap-1 mt-3 font-extrabold text-sm uppercase tracking-wider underline hover:no-underline">View
              Tool<svg class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                stroke-width="2.5" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg></a>
          </div>
        </div>
      </div>
      <button @click="resetForm"
        class="self-start inline-flex items-center justify-center px-6 h-12 font-extrabold uppercase tracking-wider text-sm transition-all cursor-pointer bg-white/90 backdrop-blur-sm border border-brand-forest/5 text-brand-forest hover:bg-accent-teal hover:text-white hover:border-accent-teal hover:shadow-md rounded-full">Submit
        Another URL</button>
    </div>

    <form v-else @submit.prevent="submitUrl" class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <label for="repoUrl" class="font-extrabold text-brand-forest uppercase tracking-wider text-sm">
            Tool Repository URL *
          </label>
        </div>

        <div
          class="flex items-center border h-14 rounded-full bg-white/95 backdrop-blur-sm shadow-sm shadow-brand-forest/5 focus-within:ring-2 focus-within:ring-accent-teal/30 transition-all duration-150"
          :class="!url ? 'border-brand-forest/5' : isValid ? 'border-accent-green' : 'border-accent-red'">
          <input type="url" id="repoUrl" v-model="url" @input="validateUrl" placeholder="https://github.com/owner/repo"
            class="flex-1 h-full bg-transparent border-none outline-none font-bold text-brand-forest placeholder:text-brand-muted text-sm px-4 m-0" />
        </div>

        <p v-if="validationMessage" class="mt-2 text-sm font-bold flex items-center gap-2 m-0"
          :class="isValid ? 'text-accent-green' : 'text-accent-red'">
          {{ validationMessage }}
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <span v-for="d in domains" :key="d.host"
          class="inline-flex items-center px-3 h-8 text-xs font-extrabold uppercase tracking-wider border transition-all duration-150 rounded-full"
          :class="detected === d.host ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal' : 'bg-white/90 border-brand-forest/5 text-brand-muted hover:border-accent-teal/20'">{{
            d.label }}</span>
      </div>

      <div v-if="submitError" class="bg-accent-red/8 text-accent-red border border-accent-red/25 rounded-2xl p-4 font-bold text-sm">{{
        submitError }}</div>

      <div class="cf-turnstile" :data-sitekey="props.sitekey" data-action="turnstile-spin-v1"></div>
      <p v-if="turnstileError" class="text-sm font-bold text-accent-red m-0">{{ turnstileError }}</p>

      <button type="submit" :disabled="!isValid || isSubmitting"
        class="w-full h-14 inline-flex items-center justify-center gap-3 font-extrabold text-xs uppercase tracking-wider text-base transition-all duration-150 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-cool text-white shadow-md shadow-accent-green/20 hover:shadow-lg hover:shadow-accent-green/30 hover:scale-[1.01] rounded-full">
        <span v-if="isSubmitting"
          class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block"></span>
        {{ isSubmitting ? 'Submitting...' : 'Submit Tool ' }}<svg v-if="!isSubmitting"
          class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
          aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
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
    bg: 'bg-accent-green/8 border border-accent-green/25',
    titleColor: 'text-accent-green',
    textColor: 'text-brand-forest/80',
    iconColor: 'text-accent-green',
    icon: '✓',
    title: 'Already in Directory',
    msg: 'This tool is already listed in our directory.',
  },
  already_approved: {
    bg: 'bg-accent-green/8 border border-accent-green/25',
    titleColor: 'text-accent-green',
    textColor: 'text-brand-forest/80',
    iconColor: 'text-accent-green',
    icon: '✓',
    title: 'Already Approved',
    msg: 'This URL has already been approved and is in our directory.',
  },
  already_pending: {
    bg: 'bg-accent-yellow/12 border border-accent-yellow/30',
    titleColor: 'text-brand-forest',
    textColor: 'text-brand-forest/80',
    iconColor: 'text-accent-yellow',
    icon: '!',
    title: 'Already Pending Review',
    msg: 'This URL is already in our review queue. No action needed.',
  },
  previously_rejected: {
    bg: 'bg-accent-red/8 border border-accent-red/25',
    titleColor: 'text-accent-red',
    textColor: 'text-brand-forest/80',
    iconColor: 'text-accent-red',
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
