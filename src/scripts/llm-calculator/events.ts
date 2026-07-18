import { goStep, resetAll } from './nav';
import { onModelChange, selPrec } from './step1';
import { syncToken, syncSlider, setTokens } from './step2';
import { toggleArchOverride, recalcLive, calcPoissonPeak } from './step3';
import { selMode } from './step4';
import { addFromCatalog, addGpuRow, removeGpuRow } from './step5';
import { renderResults } from './render-results';
import type { FtMode } from '../../interfaces/llm-calculator';

/**
 * Wire delegated event listeners on the calculator root (#calcRoot).
 * A single click/input/change listener dispatches by data-action / data-input,
 * so dynamically added GPU rows are covered without re-binding.
 */
export function bindEvents(): void {
  const root = document.getElementById('calcRoot');
  if (!root) return;

  root.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!el) return;
    switch (el.dataset.action) {
      case 'goStep': goStep(parseInt(el.dataset.step!)); break;
      case 'resetAll': resetAll(); break;
      case 'selPrec': selPrec(el.dataset.prec!, parseFloat(el.dataset.z!), el); break;
      case 'setTokens': setTokens(parseInt(el.dataset.in!), parseInt(el.dataset.out!), el); break;
      case 'selMode': selMode(el.dataset.mode as FtMode, el); break;
      case 'toggleArchOverride': toggleArchOverride(); break;
      case 'addFromCatalog': addFromCatalog(); break;
      case 'addGpuRow': addGpuRow(); break;
      case 'removeGpuRow': removeGpuRow(parseInt(el.dataset.id!)); break;
    }
  });

  root.addEventListener('input', (e) => {
    const el = (e.target as HTMLElement).closest('[data-input]') as HTMLElement | null;
    if (!el) return;
    switch (el.dataset.input) {
      case 'syncToken': syncToken(el.dataset.target!, el.value); break;
      case 'syncSlider': syncSlider(el.dataset.range!, el.value, el.dataset.view!); break;
      case 'recalcLive': recalcLive(); break;
      case 'calcPoissonPeak': calcPoissonPeak(); break;
      case 'renderResults': renderResults(); break;
    }
  });

  root.addEventListener('change', (e) => {
    const el = e.target as HTMLElement;
    if (el.id === 'modelSelect') onModelChange();
  });
}
