import { describe, it, expect } from 'vitest';
import type { CalcState } from '../../interfaces/llm-calculator';
import { calcModelMem, calcKvMem, calcTotal, calcFtMem, calcCostPerM } from '../calculations';
import { FT_SUPPORTED } from '../data';

function makeState(over: Partial<CalcState> = {}): CalcState {
  return {
    params: 70, layers: 80, attnHeads: 64, kvHeads: 8, dHead: 128,
    modelLabel: 'Llama 3.1 70B', precision: 2, precLabel: 'FP16',
    inTok: 4000, outTok: 500, users: 10, rpsAvg: 1,
    archOverridden: false, ttft: 2, ttlt: 30, mode: 'inference',
    ...over,
  };
}

describe('calculations — parity with standalone calculator', () => {
  it('M_model = P × Z × 1.2 for 70B FP16', () => {
    expect(calcModelMem(makeState())).toBeCloseTo(168, 6);
  });

  it('M_KV for 70B / 10 users / 4500 tokens', () => {
    // 2 × 10 × 4500 × 80 × 8 × 128 × 2 / 1e9 = 14.7456 GB
    expect(calcKvMem(makeState())).toBeCloseTo(14.7456, 4);
  });

  it('M_total = M_model + M_KV', () => {
    const s = makeState();
    expect(calcTotal(s)).toBeCloseTo(calcModelMem(s) + calcKvMem(s), 6);
    expect(calcTotal(s)).toBeCloseTo(182.7456, 4);
  });

  it('scales with users (more users → more KV memory)', () => {
    const few = calcKvMem(makeState({ users: 5 }));
    const many = calcKvMem(makeState({ users: 50 }));
    expect(many).toBeGreaterThan(few);
    expect(many / few).toBeCloseTo(10, 6);
  });

  it('fine-tune memory: exact table lookup, no extrapolation', () => {
    expect(calcFtMem(makeState({ mode: 'full' }))).toBe(672);
    expect(calcFtMem(makeState({ mode: 'qlora4' }))).toBe(46);
    expect(calcFtMem(makeState({ mode: 'inference' }))).toBeNull();
    // 405B is not in the table
    expect(calcFtMem(makeState({ params: 405, mode: 'full' }))).toBeNull();
  });

  it('FT_SUPPORTED covers exactly 7/13/30/70/110', () => {
    expect(FT_SUPPORTED).toEqual([7, 13, 30, 70, 110]);
  });

  it('cost per 1M prompts = annualCost / (rps × 32)', () => {
    expect(calcCostPerM(320, 1)).toBeCloseTo(10, 6);
    expect(calcCostPerM(320, 0)).toBeNull();
    expect(calcCostPerM(320, 10)).toBeCloseTo(1, 6);
  });
});
