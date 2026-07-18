import modelsData from '../../data/llm-calculator-models.json';
import gpusData from '../../data/llm-calculator-gpus.json';
import type { ModelArchMap, GpuCatalogEntry, FtRow } from '../../interfaces/llm-calculator';

/** Model architecture values, keyed by "params|layers|attnHeads|kvHeads|dHead". */
export const MODEL_ARCH = modelsData as unknown as ModelArchMap;

/** GPU catalog (vendor specs, no pricing). */
export const GPU_CATALOG = gpusData as unknown as GpuCatalogEntry[];

/**
 * Fine-tuning memory table (GB).
 * Exact values only: 7B, 13B, 30B, 70B, 110B. Columns: full / lora / qlora8 / qlora4.
 */
export const FT_TABLE: Record<number, FtRow> = {
  7:   { full: 67,   lora: 15,  qlora8: 9,   qlora4: 5  },
  13:  { full: 125,  lora: 28,  qlora8: 17,  qlora4: 9  },
  30:  { full: 288,  lora: 63,  qlora8: 38,  qlora4: 20 },
  70:  { full: 672,  lora: 146, qlora8: 88,  qlora4: 46 },
  110: { full: 1056, lora: 229, qlora8: 138, qlora4: 72 },
};

/** Parameter counts the fine-tune table covers. */
export const FT_SUPPORTED: number[] = Object.keys(FT_TABLE).map(Number);
