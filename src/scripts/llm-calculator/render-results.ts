import type { CalcState } from '../../interfaces/llm-calculator';
import { store } from './store';
import { getGpus } from './step5';
import { calcModelMem, calcKvMem, calcTotal, calcFtMem } from './calculations';
import { renderMetrics } from './render-metrics';
import { renderGpus } from './render-gpus';
import { renderFt, renderLatency, renderTco, renderConfigSummary, renderHeroAnswer } from './render-summary';

/** Assemble and inject the full results section. No-op until a model is picked. */
export function renderResults(): void {
  const s: CalcState = store.state;
  if (!s.params) return;

  const mMem = calcModelMem(s);
  const kvMem = calcKvMem(s);
  const total = calcTotal(s);
  const tSeq = s.inTok + s.outTok;
  const gpus = getGpus();
  const ftMem = calcFtMem(s);

  const ttft = parseFloat(document.getElementById('ttft')?.value as string) || s.ttft;
  const ttlt = parseFloat(document.getElementById('ttlt')?.value as string) || s.ttlt;
  const rpsVal = parseFloat(document.getElementById('rpsAvg')?.value as string) || 0;
  const peak95 = rpsVal > 0 ? rpsVal + 1.645 * Math.sqrt(rpsVal) : null;

  const breakdownHtml = `
    <div class="space-y-3">
      ${renderMetrics(s, mMem, kvMem, total, tSeq)}
      ${renderFt(s, ftMem)}
      <div class="card">
        <p class="sec-hdr">GPUs you need</p>
        <p class="text-brand-muted text-xs mb-4">GPUs needed = total memory ÷ memory per GPU (rounded up). Link servers when you need more than 2 GPUs.</p>
        ${renderGpus(gpus, total, ftMem, rpsVal)}
      </div>
      ${renderLatency(s, ttft, ttlt, rpsVal, peak95)}
      ${renderConfigSummary(s, tSeq, rpsVal, peak95)}
    </div>
  `;

  const payload = {
    model: s.modelLabel,
    params: s.params,
    precision: s.precLabel,
    inTok: s.inTok,
    outTok: s.outTok,
    users: s.users,
    rps: rpsVal,
    ttft: ttft,
    ttlt: ttlt,
    mode: s.mode
  };
  const encodedData = btoa(encodeURIComponent(JSON.stringify(payload)));

  const html = `
    ${renderHeroAnswer(total, gpus)}
    ${renderTco(gpus, rpsVal)}
    <details class="collapsible-section card mb-5">
      <summary>Full calculation breakdown</summary>
      <div class="mt-4">
        ${breakdownHtml}
      </div>
    </details>

    <div class="card mb-5 border-brand-teal bg-brand-forest/5 text-center p-6">
      <h2 class="text-xl font-bold text-brand-forest mb-2">Don't guess your hardware needs.</h2>
      <p class="text-brand-muted text-sm mb-4">Calculators give you targets, but real-world performance varies. Get certainty before you buy.</p>
      <a href="/benchmark-offer?d=${encodedData}" class="btn-primary block w-full md:w-auto md:inline-block text-center">Get Custom Sizing & Benchmark Data</a>
    </div>
  `;

  document.getElementById('resultsSection')!.innerHTML = html;
}
