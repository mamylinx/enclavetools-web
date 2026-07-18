import { fmt } from './format';
import type { CalcState } from '../../interfaces/llm-calculator';

/** Build the "How much memory you need" card (formulas + metric boxes + note). */
export function renderMetrics(s: CalcState, mMem: number, kvMem: number, total: number, tSeq: number): string {
  return `
    <div class="card mb-5">
      <p class="sec-hdr">How much memory you need</p>

      <div class="formula-box mb-5">
        <div><span class="fh">M_model</span> = P × Z × 1.2 = <span class="fv">${s.params}B × ${s.precision} × 1.2</span> = <strong class="text-brand-forest">${fmt(mMem)}</strong> <span class="text-xs text-brand-muted">(memory the model itself needs)</span></div>
        <div class="mt-1"><span class="fh">T_seq</span> = input + output = <span class="fv">${s.inTok.toLocaleString()} + ${s.outTok.toLocaleString()}</span> = <strong class="text-brand-forest">${tSeq.toLocaleString()} tokens</strong> <span class="text-xs text-brand-muted">(full length of one prompt plus its response)</span></div>
        <div class="mt-1"><span class="fh">M_KV</span> = 2 × C × T_seq × L × N_KV_heads × D_head × Z</div>
        <div class="ml-4 text-xs text-brand-muted mt-0.5">= 2 × ${s.users} × ${tSeq.toLocaleString()} × ${s.layers} × ${s.kvHeads} × ${s.dHead} × ${s.precision}</div>
        <div class="ml-4 mt-0.5">= <strong class="text-brand-forest">${fmt(kvMem)}</strong> <span class="text-xs text-brand-muted">(memory the AI holds while it works)</span></div>
        <div class="mt-2 pt-2 border-t border-brand-forest/10"><span class="fh">M_total</span> = M_model + M_KV = <span class="fv">${fmt(mMem)} + ${fmt(kvMem)}</span> = <strong class="text-brand-forest text-base">${fmt(total)}</strong> <span class="text-xs text-brand-muted">(total memory your GPUs must have)</span></div>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-5">
        <div class="metric-box"><div class="metric-val">${fmt(mMem)}</div><div class="metric-lbl">Model memory</div></div>
        <div class="metric-box"><div class="metric-val">${fmt(kvMem)}</div><div class="metric-lbl">Memory while working (${s.users} people × ${tSeq.toLocaleString()} tokens)</div></div>
        <div class="metric-box" style="border-color:#05B2A3"><div class="metric-val">${fmt(total)}</div><div class="metric-lbl">Total memory needed</div></div>
        <div class="metric-box"><div class="metric-val" style="font-size:18px">${s.precLabel} / ${s.params}B params / ${s.users} users</div><div class="metric-lbl">Your setup</div></div>
      </div>

      <div class="info-box text-xs mb-1">
        <strong class="text-brand-teal">Memory note:</strong> With ${s.users} concurrent users and ${tSeq.toLocaleString()}-token prompts, the memory the AI holds while it works (${fmt(kvMem)})
        ${kvMem > mMem ? '<strong class="text-amber-600">can be larger than the model itself</strong>' : 'is within model memory bounds'} — that's normal at scale. The guide says this memory can outweigh the model.
      </div>
    </div>`;
}
