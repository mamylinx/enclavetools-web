import { fmt } from './format';
import { calcCostPerM } from './calculations';
import type { GpuRow } from '../../interfaces/llm-calculator';

/** Build the per-GPU analysis cards (needed count, fit pill, training, cost). */
export function renderGpus(gpus: GpuRow[], total: number, ftMem: number | null, rps: number): string {
  if (gpus.length === 0) {
    return `<div class="warn-box">No GPUs entered yet. Add at least one GPU above to see how many cards you need.</div>`;
  }

  let html = '<div class="space-y-3">';
  gpus.forEach((g, i) => {
    const needed = Math.ceil(total / g.vram);
    const totalVram = needed * g.vram;
    const surplus = totalVram - total;
    const meetsNeeds = totalVram >= total;

    const hasPrice = g.price > 0;
    const hasOpex = g.opex > 0;
    const hasRps = rps > 0;

    let costLine = '';
    if (hasPrice && hasOpex && hasRps) {
      const annualHw = g.price / 3;
      const annualTotal = annualHw * needed + g.opex * needed;
      const cpm = calcCostPerM(annualTotal, rps)!;
      costLine = `
        <div class="mt-3 pt-3" style="border-top:1px solid rgba(27,54,27,0.1);">
          <div class="grid grid-cols-2 gap-2">
            <div class="metric-box">
              <div class="text-xl font-extrabold bg-linear-to-br from-brand-teal to-brand-indigo bg-clip-text text-transparent">$${cpm.toFixed(2)}</div>
              <div class="metric-lbl">Cost per 1M prompts</div>
            </div>
            <div class="metric-box">
              <div class="text-xl font-extrabold bg-linear-to-br from-brand-teal to-brand-indigo bg-clip-text text-transparent">$${annualTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</div>
              <div class="metric-lbl">Yearly cost (${needed} GPUs)</div>
            </div>
          </div>
          <div class="text-[11px] text-brand-muted mt-1.5">Hardware amortized 3yr: $${(annualHw * needed).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr · Opex: $${(g.opex * needed).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</div>
        </div>`;
    } else {
      const missing: string[] = [];
      if (!hasPrice) missing.push('purchase price / GPU (column 3 above)');
      if (!hasOpex) missing.push('yearly opex / GPU (column 4 above)');
      if (!hasRps) missing.push('average requests per second (Step 3)');
      costLine = `
        <div class="mt-2 pt-2" style="border-top:1px solid rgba(27,54,27,0.1);">
          <div class="warn-box text-xs">
            💰 To show cost per 1M prompts, we still need:<br/>
            ${missing.map(m => `&nbsp;&nbsp;· ${m}`).join('<br/>')}
          </div>
        </div>`;
    }

    let ftLine = '';
    if (ftMem) {
      const ftNeeded = Math.ceil(ftMem / g.vram);
      ftLine = `<div class="mt-1 text-xs text-amber-600">Training: needs <strong>${ftMem} GB</strong> → <strong>${ftNeeded}× ${g.name || 'this GPU'}</strong></div>`;
    }

    html += `
      <div class="rec-card ${i === 0 ? 'best' : ''}">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-brand-forest font-bold text-sm">${needed}× ${g.name}</div>
            <div class="text-brand-muted text-xs mt-0.5">${fmt(totalVram)} total (${fmt(g.vram)} per GPU) · spare: ${fmt(surplus)}</div>
          </div>
          <span class="pill ${meetsNeeds ? 'pill-green' : 'pill-red'} text-xs">${meetsNeeds ? '✓ Enough' : '✗ Not enough'}</span>
        </div>
        ${ftLine}${costLine}
      </div>`;
  });
  html += '</div>';
  return html;
}
