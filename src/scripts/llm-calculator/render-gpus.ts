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
      const annualHw = g.price / 3; // 3-year hardware amortization
      const annualTotal = annualHw * needed + g.opex * needed;
      const cpm = calcCostPerM(annualTotal, rps)!;
      costLine = `
        <div class="mt-3 pt-3" style="border-top:1px solid rgba(27,54,27,0.1);">
          <div class="grid grid-cols-2 gap-2">
            <div style="background:#FAF8F5;border:1px solid rgba(27,54,27,0.1);border-radius:10px;padding:10px 12px;">
              <div style="font-size:20px;font-weight:800;background:linear-gradient(135deg,#05B2A3,#5D3FD3);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">$${cpm.toFixed(2)}</div>
               <div style="font-size:10px;color:#5F6368;text-transform:uppercase;letter-spacing:.05em;margin-top:3px;">Cost per 1M prompts</div>
            </div>
            <div style="background:#FAF8F5;border:1px solid rgba(27,54,27,0.1);border-radius:10px;padding:10px 12px;">
              <div style="font-size:20px;font-weight:800;background:linear-gradient(135deg,#05B2A3,#5D3FD3);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">$${annualTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</div>
               <div style="font-size:10px;color:#5F6368;text-transform:uppercase;letter-spacing:.05em;margin-top:3px;">Yearly cost to run (${needed} GPUs)</div>
            </div>
          </div>
           <div class="text-[11px] text-brand-muted mt-1.5">Hardware cost spread over 3 years: $${(annualHw * needed).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr · Yearly opex: $${(g.opex * needed).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</div>
        </div>`;
    } else {
      const missing: string[] = [];
      if (!hasPrice) missing.push('purchase price / GPU (column 3 above)');
      if (!hasOpex) missing.push('yearly opex / GPU (column 4 above)');
      if (!hasRps) missing.push('average requests per second (Step 3)');
      costLine = `
        <div class="mt-2 pt-2" style="border-top:1px solid rgba(27,54,27,0.1);">
          <div style="font-size:11px;color:#92400E;background:#FFFBEB;border:1px solid #FCD34D;border-radius:10px;padding:8px 12px;">
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
            <div class="text-brand-muted text-xs mt-0.5">${fmt(totalVram)} total memory (${fmt(g.vram)} per GPU) · spare: ${fmt(surplus)}</div>
          </div>
          <span class="pill ${meetsNeeds ? 'pill-green' : 'pill-red'} text-xs">${meetsNeeds ? '✓ Enough' : '✗ Not enough'}</span>
        </div>
        ${ftLine}${costLine}
      </div>`;
  });
  html += '</div>';
  return html;
}
