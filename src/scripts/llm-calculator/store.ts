import type { CalcState } from '../../interfaces/llm-calculator';

/** Create a fresh calculator state with the default values. */
export function createDefaultState(): CalcState {
  return {
    params: 0, layers: 0, attnHeads: 0, kvHeads: 0, dHead: 0,
    modelLabel: '', precision: 2, precLabel: 'FP16',
    inTok: 4000, outTok: 500, users: 10, rpsAvg: 1,
    archOverridden: false, ttft: 2, ttlt: 30, mode: 'inference',
  };
}

/** Single mutable source of truth shared across modules. */
export const store = {
  state: createDefaultState(),
  gpuRows: [] as number[],
  gpuIdCounter: 0,
};

/** Reset the store back to defaults (used by "Start Over"). */
export function resetStore(): void {
  store.state = createDefaultState();
  store.gpuRows = [];
  store.gpuIdCounter = 0;
}
