import type { CalcState, GpuRow } from '../../interfaces/llm-calculator';

const MODE_LABELS: Record<string, string> = {
  full: 'Train fully (16-bit)',
  lora: 'Train with LoRA (16-bit)',
  qlora8: 'Train with QLoRA (8-bit)',
  qlora4: 'Train with QLoRA (4-bit)',
};

const USE_LABELS: Record<string, string> = {
  inference: 'Just run the AI',
  full: 'Train fully (16-bit)',
  lora: 'Train with LoRA (16-bit)',
  qlora8: 'Train with QLoRA (8-bit)',
  qlora4: 'Train with QLoRA (4-bit)',
};

/** Build the fine-tuning memory block (or empty string when in inference mode). */
export function renderFt(s: CalcState, ftMem: number | null): string {
  if (s.mode === 'inference') return '';
  const modeLabel = MODE_LABELS[s.mode];
  if (ftMem) {
    return `
      <div class="card-warn mb-5">
        <p class="sec-hdr" style="color:#92400E;border-color:#F59E0B;">Training memory (guide table)</p>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="metric-box"><div class="metric-val amber">${ftMem} GB</div><div class="metric-lbl">Training memory needed</div></div>
          <div class="metric-box"><div class="metric-val amber">${s.params}B / ${modeLabel}</div><div class="metric-lbl">Model &amp; method</div></div>
        </div>
        <div class="warn-box text-xs">
           From the guide's table — exact value for the ${s.params}B model using ${modeLabel}.<br/>
          Training usually runs in separate sessions; the same GPUs can run the AI afterward.
        </div>
      </div>`;
  }
  return `<div class="card-warn mb-5"><p class="text-amber-600 text-sm font-semibold">Fine-tuning memory estimate not available</p><p class="text-amber-700 text-xs mt-1">The guide's Table 1 only covers 7B, 13B, 30B, 70B, and 110B models. This model size is not in the table.</p></div>`;
}

/** Build the "Reply speed and volume" card. */
export function renderLatency(ttft: number, ttlt: number, rps: number, peak95: number | null): string {
  return `
    <div class="card mb-5">
      <p class="sec-hdr">Reply speed and volume</p>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="metric-box"><div class="metric-val" style="font-size:22px">${ttft}s</div><div class="metric-lbl">Target time to first word</div></div>
        <div class="metric-box"><div class="metric-val" style="font-size:22px">${ttlt}s</div><div class="metric-lbl">Target total reply time</div></div>
        ${rps > 0 ? `<div class="metric-box"><div class="metric-val" style="font-size:22px">${rps} rps</div><div class="metric-lbl">Requests per second (average)</div></div>
        <div class="metric-box"><div class="metric-val" style="font-size:22px">${peak95 ? peak95.toFixed(2) : '—'} rps</div><div class="metric-lbl">Peak requests per second</div></div>` : ''}
      </div>
      <div class="warn-box text-xs">
        ⚠️ <strong>These are planning targets only.</strong> Real speed depends on your GPU's benchmarks at this load. The guide suggests checking the maker's benchmark data before you buy.<br/><br/>
        The guide notes: tighter speed limits cut how much the system can do at once. Check benchmark graphs (speed vs prompts per second) to find the point that meets both targets.
      </div>
    </div>`;
}

/** Build the "What it costs to run" (TCO) card. */
export function renderTco(gpuList: GpuRow[], rps: number): string {
  const anyHasPrice = gpuList.some(g => g.price > 0);
  const anyHasOpex = gpuList.some(g => g.opex > 0);

  let body: string;
  if (gpuList.length === 0) {
    body = `<div class="warn-box text-xs">➊ Add a GPU above &nbsp; ➋ Enter purchase price &nbsp; ➌ Enter yearly opex &nbsp; ➍ Enter requests per second in Step 3 — cost per 1M prompts will appear here and inside each GPU card above.</div>`;
  } else {
    const steps: string[] = [];
    if (!anyHasPrice) steps.push('➋ Enter <strong>purchase price / GPU</strong> in the GPU table above');
    if (!anyHasOpex) steps.push('➌ Enter <strong>yearly opex / GPU</strong> in the GPU table above (power + space + upkeep)');
    if (!rps) steps.push('➍ Enter <strong>average requests per second</strong> back in Step 3');
    body = steps.length > 0
      ? `<div class="warn-box text-xs">Cost per 1M prompts will show inside each GPU card above once you provide:<br/>${steps.join('<br/>')}</div>`
      : `<div class="ok-box text-xs">✓ All inputs provided — cost per 1M prompts is shown inside each GPU above.</div>`;
  }

  return `
    <div class="card mb-5">
      <p class="sec-hdr">What it costs to run</p>
      <div class="formula-box mb-4">
        <div><span class="fh">Z</span> ≈ C / (X × 32)</div>
        <div class="text-xs mt-1" style="color:#5F6368;">Cost per 1M prompts = yearly cost ÷ (prompts per second × 32)</div>
        <div class="text-xs mt-1" style="color:#5F6368;">Yearly cost = (price ÷ 3 years + yearly opex) × number of GPUs</div>
      </div>
      ${body}
    </div>`;
}

/** Build the "Configuration Summary" table. */
export function renderConfigSummary(s: CalcState, tSeq: number, rps: number, peak95: number | null): string {
  return `
    <div class="card mb-2">
      <p class="sec-hdr">Configuration Summary</p>
      <table>
        <tr><td class="text-brand-muted">Model</td><td class="font-medium">${s.modelLabel} (${s.params}B params)</td></tr>
        <tr><td class="text-brand-muted">Precision</td><td>${s.precLabel} (Z = ${s.precision} bytes)</td></tr>
        <tr><td class="text-brand-muted">Model details</td><td>${s.layers} layers · ${s.attnHeads} attn heads · ${s.kvHeads} KV heads · D_head = ${s.dHead}${s.archOverridden ? ' <span class="pill pill-amber" style="font-size:10px">overridden</span>' : ''}</td></tr>
        <tr><td class="text-brand-muted">Length of each request</td><td>${tSeq.toLocaleString()} tokens (${s.inTok.toLocaleString()} in + ${s.outTok.toLocaleString()} out)</td></tr>
        <tr><td class="text-brand-muted">Concurrent users</td><td>${s.users}</td></tr>
        ${rps > 0 ? `<tr><td class="text-brand-muted">Requests per second (avg / peak)</td><td>${rps} / ${peak95 ? peak95.toFixed(2) : '—'} req/s</td></tr>` : ''}
        <tr><td class="text-brand-muted">Speed targets</td><td>TTFT ≤ ${s.ttft}s · TTLT ≤ ${s.ttlt}s</td></tr>
        <tr><td class="text-brand-muted">What you'll use it for</td><td>${USE_LABELS[s.mode]}</td></tr>
      </table>
    </div>`;
}
