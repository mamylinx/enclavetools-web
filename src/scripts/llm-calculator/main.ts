import { populateCatalog } from './step5';
import { bindEvents } from './events';
import { goStep } from './nav';
import { onModelChange } from './step1';

function checkUrlParams(): void {
  const params = new URLSearchParams(window.location.search);
  const modelParam = params.get('model');
  if (!modelParam) return;

  const sel = document.getElementById('modelSelect') as HTMLSelectElement | null;
  if (!sel) return;

  const target = modelParam.toLowerCase();
  for (let i = 0; i < sel.options.length; i++) {
    const opt = sel.options[i];
    const text = opt.textContent?.toLowerCase() || '';
    if (text.includes(target) || target.includes(text)) {
      sel.selectedIndex = i;
      onModelChange();
      break;
    }
  }
}

/** Entry point: build the catalog, wire events, handle URL params, and show step 1. */
populateCatalog();
bindEvents();
checkUrlParams();
goStep(1);

