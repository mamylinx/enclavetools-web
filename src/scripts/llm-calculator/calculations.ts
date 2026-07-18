import type { CalcState } from '../../interfaces/llm-calculator';
import { FT_TABLE, FT_SUPPORTED } from './data';

/** M_model = P × Z × 1.2 (Guide p.2) */
export function calcModelMem(s: CalcState): number {
  return s.params * s.precision * 1.2;
}

/**
 * M_KV = 2 × C_users × T_seq × L_layers × N_KV_heads × D_head × Z (Guide p.9).
 * T_seq = input + output tokens. Result is in bytes → divide by 1e9 for GB.
 */
export function calcKvMem(s: CalcState): number {
  const tSeq = s.inTok + s.outTok;
  const bytes = 2 * s.users * tSeq * s.layers * s.kvHeads * s.dHead * s.precision;
  return bytes / 1e9;
}

/** M_total = M_model + M_KV (Guide p.10) */
export function calcTotal(s: CalcState): number {
  return calcModelMem(s) + calcKvMem(s);
}

/** Fine-tune memory: exact table lookup — no extrapolation. Returns null when N/A. */
export function calcFtMem(s: CalcState): number | null {
  if (s.mode === 'inference') return null;
  if (!FT_SUPPORTED.includes(s.params)) return null;
  const row = FT_TABLE[s.params];
  if (!row) return null;
  const col: Record<string, keyof FtRow> = { full: 'full', lora: 'lora', qlora8: 'qlora8', qlora4: 'qlora4' };
  return row[col[s.mode]];
}

/** On-prem cost per 1M prompts: Z ≈ C / (X × 32) (Guide p.21) */
export function calcCostPerM(annualCost: number, throughputRps: number): number | null {
  if (!throughputRps || throughputRps <= 0) return null;
  return annualCost / (throughputRps * 32);
}
