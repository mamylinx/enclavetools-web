import { ref } from 'vue';

export function useClipboard(resetMs = 2400) {
  const status = ref<'idle' | 'copied' | 'failed'>('idle');

  async function copy(text: string) {
    status.value = 'idle';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      status.value = 'copied';
    } catch {
      status.value = 'failed';
    } finally {
      window.setTimeout(() => { status.value = 'idle'; }, resetMs);
    }
  }

  return { status, copy };
}
