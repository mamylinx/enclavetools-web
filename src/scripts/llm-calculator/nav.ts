import { store, resetStore } from './store';
import { renderResults } from './render-results';

/** Show step n and update the step indicator; render results when reaching step 5. */
export function goStep(n: number): void {
  const s = store.state;
  if (n === 2 && !s.params) { alert('Select a model first.'); return; }

  [1, 2, 3, 4, 5].forEach(i => {
    const el = document.getElementById('step' + i)!;
    el.classList.add('hidden');
    el.classList.remove('fade-in');
  });

  const t = document.getElementById('step' + n)!;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('fade-in'), 10);

  [1, 2, 3, 4, 5].forEach(i => {
    const d = document.getElementById('sd' + i)!;
    d.className = 'step-dot';
    if (i < n) d.classList.add('done');
    else if (i === n) d.classList.add('active');
    if (i < 5) {
      const l = document.getElementById('sl' + i)!;
      l.className = 'step-line';
      if (i < n) l.classList.add('done');
    }
  });

  if (n === 5) renderResults();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Reset everything to defaults and return to step 1. */
export function resetAll(): void {
  resetStore();
  const s = store.state;

  (document.getElementById('modelSelect') as HTMLSelectElement).value = '';
  document.getElementById('modelNote')!.classList.add('hidden');
  (document.getElementById('s1next') as HTMLButtonElement).disabled = true;
  (document.getElementById('inTok') as HTMLInputElement).value = String(s.inTok);
  (document.getElementById('outTok') as HTMLInputElement).value = String(s.outTok);
  (document.getElementById('inTokR') as HTMLInputElement).value = String(s.inTok);
  (document.getElementById('outTokR') as HTMLInputElement).value = String(s.outTok);
  document.getElementById('inTokV')!.textContent = s.inTok.toLocaleString();
  document.getElementById('outTokV')!.textContent = s.outTok.toLocaleString();
  document.getElementById('ctxWindowLive')!.textContent = (s.inTok + s.outTok).toLocaleString();
  (document.getElementById('usersN') as HTMLInputElement).value = String(s.users);
  (document.getElementById('usersR') as HTMLInputElement).value = String(s.users);
  document.getElementById('usersV')!.textContent = String(s.users);
  (document.getElementById('rpsAvg') as HTMLInputElement).value = String(s.rpsAvg);
  (document.getElementById('ttft') as HTMLInputElement).value = String(s.ttft);
  (document.getElementById('ttlt') as HTMLInputElement).value = String(s.ttlt);

  document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('sel'));
  document.querySelector('[data-prec="FP16"]')?.classList.add('sel');
  document.querySelector('[data-mode="inference"]')?.classList.add('sel');

  document.getElementById('gpuBody')!.innerHTML = '';
  document.getElementById('archOverride')!.classList.add('hidden');

  goStep(1);
}
