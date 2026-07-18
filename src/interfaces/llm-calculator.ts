/** Model architecture keyed by "params|layers|attnHeads|kvHeads|dHead". */
export interface ModelArch {
  label: string;
  params: number;
  layers: number;
  attnH: number;
  kvH: number;
  dHead: number;
  note: string;
}
export type ModelArchMap = Record<string, ModelArch>;

/** A GPU from the catalog (vendor spec, no pricing). */
export interface GpuCatalogEntry {
  group: string;
  name: string;
  vram: number;
  note: string;
}

/** A GPU row the user added in the calculator UI. */
export interface GpuRow {
  id: number;
  name: string;
  vram: number;
  price: number;
  opex: number;
}

/** What the AI will be used for. */
export type FtMode = 'inference' | 'qlora4' | 'qlora8' | 'lora' | 'full';

/** Full calculator state (single source of truth). */
export interface CalcState {
  params: number;
  layers: number;
  attnHeads: number;
  kvHeads: number;
  dHead: number;
  modelLabel: string;
  precision: number;
  precLabel: string;
  inTok: number;
  outTok: number;
  users: number;
  rpsAvg: number;
  archOverridden: boolean;
  ttft: number;
  ttlt: number;
  mode: FtMode;
}

/** Fine-tune memory lookup row (GB) from the fine-tuning table. */
export interface FtRow {
  full: number;
  lora: number;
  qlora8: number;
  qlora4: number;
}
