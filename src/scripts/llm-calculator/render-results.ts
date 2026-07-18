import type { CalcState } from '../../interfaces/llm-calculator';
import { store } from './store';
import { getGpus } from './step5';
import { calcModelMem, calcKvMem, calcTotal, calcFtMem } from './calculations';
import { renderMetrics } from './render-metrics';
import { renderGpus } from './render-gpus';
import { renderFt, renderLatency, renderTco, renderConfigSummary } from './render-summary';

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

  const html = `
    ${renderMetrics(s, mMem, kvMem, total, tSeq)}
    ${renderFt(s, ftMem)}
    <div class="card mb-5">
      <p class="sec-hdr">GPUs you need</p>
      <p class="text-brand-muted text-xs mb-4">GPUs needed = total memory ÷ memory per GPU (rounded up). The guide suggests linked servers when you need more than 2 GPUs.</p>
      ${renderGpus(gpus, total, ftMem, rpsVal)}
    </div>
    ${renderLatency(ttft, ttlt, rpsVal, peak95)}
    ${renderTco(gpus, rpsVal)}
    ${renderConfigSummary(s, tSeq, rpsVal, peak95)}
  `;

  document.getElementById('resultsSection')!.innerHTML = html;
}
