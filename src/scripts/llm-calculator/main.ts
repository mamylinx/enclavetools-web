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

  // 1) Exact match on the option value (the catalog key), e.g. "671|61|128|128|128".
  for (let i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === modelParam) {
      sel.selectedIndex = i;
      onModelChange();
      return;
    }
  }

  // 2) Normalized fuzzy match against option labels, as a compatibility fallback.
  const normalize = (s: string) => s.toLowerCase().replace(/[\s-_.]+/g, '').replace(/bparameters$/g, '');
  const target = normalize(modelParam);
  let matchedIndex = -1;
  let matchedText = '';
  for (let i = 0; i < sel.options.length; i++) {
    const text = normalize(sel.options[i].textContent || '');
    if (
      target &&
      (text.includes(target) || target.includes(text)) &&
      (matchedIndex === -1 || text.length < matchedText.length)
    ) {
      matchedIndex = i;
      matchedText = text;
    }
  }
  if (matchedIndex > 0) {
    sel.selectedIndex = matchedIndex;
    onModelChange();
  }
}

/** Entry point: build the catalog, wire events, handle URL params, and show step 1. */
populateCatalog();
bindEvents();
checkUrlParams();
goStep(1);

