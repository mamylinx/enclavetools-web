<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const visible = ref(false);
const expanded = ref(false);
const analytics = ref(false);

function show() {
  visible.value = true;
}

function hide() {
  visible.value = false;
  expanded.value = false;
}

function handleOpenConsent() {
  show();
}

function handleConsentChanged(e) {
  analytics.value = e.detail.analytics;
}

onMounted(function () {
  document.addEventListener("enclave:open-consent", handleOpenConsent);
  document.addEventListener("enclave:consent-changed", handleConsentChanged);

  if (window.EnclaveConsent && !window.EnclaveConsent.hasConsented()) {
    show();
  }
});

onUnmounted(function () {
  document.removeEventListener("enclave:open-consent", handleOpenConsent);
  document.removeEventListener("enclave:consent-changed", handleConsentChanged);
});

function acceptAll() {
  window.EnclaveConsent.grantAll();
  hide();
}

function rejectAll() {
  window.EnclaveConsent.denyAll();
  hide();
}

function savePreferences() {
  window.EnclaveConsent.setPreferences(analytics.value);
  hide();
}
</script>

<template>
  <div
    v-if="visible"
    role="dialog"
    aria-modal="true"
    aria-label="Cookie consent preferences"
    class="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
  >
    <div class="max-w-[1400px] mx-auto bg-white/98 backdrop-blur-md border border-brand-forest/5 rounded-3xl shadow-2xl shadow-brand-forest/20 overflow-hidden card-accent-border">
      <!-- Collapsed state -->
      <div v-if="!expanded" class="p-5 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <svg class="w-5 h-5 text-accent-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 class="text-sm font-extrabold text-brand-forest">
                Your Privacy Choices
              </h2>
            </div>
            <p class="text-xs text-brand-muted leading-relaxed">
              We use cookies only for analytics to improve your experience. You can accept or reject non-essential cookies at any time.
              <a href="/privacy" class="text-accent-teal hover:underline font-semibold ml-1">Learn more</a>
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <button
              @click="acceptAll"
              class="px-6 py-2.5 rounded-full bg-gradient-cool text-white text-xs font-bold shadow-md shadow-accent-green/20 hover:shadow-lg hover:shadow-accent-green/30 hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2"
            >
              Accept All
            </button>
            <button
              @click="rejectAll"
              class="px-6 py-2.5 rounded-full bg-white/90 border border-brand-forest/5 text-brand-forest text-xs font-bold hover:bg-white hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2"
            >
              Reject All
            </button>
            <button
              @click="expanded = true"
              class="px-3 py-2.5 text-accent-teal text-xs font-bold hover:text-brand-forest transition-colors focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2 rounded-full"
            >
              Preferences
            </button>
          </div>
        </div>
      </div>

      <!-- Expanded state -->
      <div v-else class="p-5 sm:p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-base font-extrabold text-brand-forest">
            Cookie Preferences
          </h2>
          <button
            @click="expanded = false"
            class="text-brand-forest/50 hover:text-accent-red text-lg w-8 h-8 flex items-center justify-center rounded-full bg-brand-forest/5 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-teal"
            aria-label="Collapse preferences"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Necessary -->
          <div class="flex items-start gap-3 p-4 bg-linear-to-br from-brand-tealLight/40 to-brand-bg border border-brand-forest/5 rounded-2xl">
            <input
              type="checkbox"
              checked
              disabled
              class="mt-0.5 w-4 h-4 rounded border-brand-forest/20 accent-accent-teal text-accent-teal focus:ring-accent-teal cursor-not-allowed opacity-70"
              aria-label="Necessary cookies always enabled"
            />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-brand-forest">Strictly Necessary</span>
                <span class="text-[10px] font-bold uppercase tracking-wider text-accent-green bg-accent-green/10 border border-accent-green/20 px-2 py-0.5 rounded-full">Always On</span>
              </div>
              <p class="text-xs text-brand-muted mt-1 leading-relaxed">
                Required for the website to function properly. Cannot be disabled.
              </p>
            </div>
          </div>

          <!-- Analytics -->
          <div class="flex items-start gap-3 p-4 bg-linear-to-br from-brand-tealLight/40 to-brand-bg border border-brand-forest/5 rounded-2xl">
            <input
              v-model="analytics"
              type="checkbox"
              id="consent-analytics"
              class="mt-0.5 w-4 h-4 rounded border-brand-forest/20 accent-accent-teal text-accent-teal focus:ring-accent-teal cursor-pointer"
              aria-label="Analytics cookies toggle"
            />
            <div class="flex-1">
              <label for="consent-analytics" class="text-sm font-bold text-brand-forest cursor-pointer">Analytics</label>
              <p class="text-xs text-brand-muted mt-1 leading-relaxed">
                Helps us understand how visitors interact with our website by collecting anonymous usage data via Google Analytics.
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-3 mt-5 pt-5 border-t border-brand-forest/5">
          <button
            @click="rejectAll"
            class="px-6 py-2.5 rounded-full bg-white/90 border border-brand-forest/5 text-brand-forest text-xs font-bold hover:bg-white hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2"
          >
            Reject All
          </button>
          <button
            @click="acceptAll"
            class="px-6 py-2.5 rounded-full bg-gradient-cool text-white text-xs font-bold shadow-md shadow-accent-green/20 hover:shadow-lg hover:shadow-accent-green/30 hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2"
          >
            Accept All
          </button>
          <button
            @click="savePreferences"
            class="px-6 py-2.5 rounded-full bg-gradient-brand text-white text-xs font-bold shadow-md shadow-brand-forest/15 hover:shadow-lg hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
