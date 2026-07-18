import { store } from './store';

/** Step 3: toggle the advanced architecture override panel. */
export function toggleArchOverride(): void {
  document.getElementById('archOverride')!.classList.toggle('hidden');
}

/** Step 3: read override fields into state (sets archOverridden on first edit). */
export function recalcLive(): void {
  const s = store.state;
  s.archOverridden = true;
  s.layers = parseInt((document.getElementById('ovrLayers') as HTMLInputElement).value) || s.layers;
  s.attnHeads = parseInt((document.getElementById('ovrAttnH') as HTMLInputElement).value) || s.attnHeads;
  s.kvHeads = parseInt((document.getElementById('ovrKvH') as HTMLInputElement).value) || s.kvHeads;
  s.dHead = parseInt((document.getElementById('ovrDHead') as HTMLInputElement).value) || s.dHead;
}

/** Step 3: compute the 95th-percentile Poisson peak from average RPS. */
export function calcPoissonPeak(): void {
  const rps = parseFloat((document.getElementById('rpsAvg') as HTMLInputElement).value) || 0;
  store.state.rpsAvg = rps;
  const el = document.getElementById('rpsPeak')!;
  if (rps <= 0) {
    el.textContent = 'Enter a valid requests-per-second value.';
    return;
  }
  const peak95 = rps + 1.645 * Math.sqrt(rps);
  el.innerHTML = `Estimated peak: <strong class="text-brand-forest">${peak95.toFixed(2)}</strong> requests/sec &nbsp;·&nbsp; Peak per minute: <strong class="text-brand-forest">${(peak95 * 60).toFixed(0)}</strong><br/><span class="note">Formula: average + 1.645 × √average — the guide's method for on-prem sizing</span>`;
}
