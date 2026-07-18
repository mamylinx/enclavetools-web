import { store } from './store';
import { FT_SUPPORTED } from './data';
import type { FtMode } from '../../interfaces/llm-calculator';

/** Step 4: training mode chosen — update state, highlight, re-check support. */
export function selMode(mode: FtMode, btn: HTMLElement): void {
  store.state.mode = mode;
  document.querySelectorAll('#step4 .choice-btn[data-action="selMode"]').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  checkFtSupport();
}

/** Show/hide the fine-tune-not-supported warning for the current model + mode. */
export function checkFtSupport(): void {
  const el = document.getElementById('ftNotSupported');
  if (!el) return;
  const s = store.state;
  if (s.mode !== 'inference' && s.params > 0 && !FT_SUPPORTED.includes(s.params)) {
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}
