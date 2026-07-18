#!/usr/bin/env bun
/**
 * Fetch LLM models from Hugging Face Hub and extract architecture parameters
 * for the LLM VRAM Calculator.
 * 
 * Usage: bun run src/scripts/fetch-hf-models.ts [options]
 * Options:
 *   --min-params <B>   Minimum parameters in billions (default: 1)
 *   --max-params <B>   Maximum parameters in billions (default: 500)
 *   --limit <N>        Max models to fetch (default: 200)
 *   --output <path>    Output JSON file (default: src/data/llm-calculator-models.json)
 *   --token <token>    HF token for gated models (optional, uses HF_TOKEN env var)
 */

import { HfApi } from "huggingface_hub";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";

interface ModelArch {
  label: string;
  params: number;
  layers: number;
  attnH: number;
  kvH: number;
  dHead: number;
  note: string;
}

interface ConfigData {
  architectures?: string[];
  model_type?: string;
  hidden_size?: number;
  num_hidden_layers?: number;
  num_attention_heads?: number;
  num_key_value_heads?: number;
  head_dim?: number;
  intermediate_size?: number;
  vocab_size?: number;
  num_experts?: number;
  num_experts_per_tok?: number;
  moe_intermediate_size?: number;
  text_config?: ConfigData;
  [key: string]: any;
}

interface ModelInfo {
  id: string;
  pipeline_tag?: string;
  tags?: string[];
  downloads?: number;
  likes?: number;
  lastModified?: string;
  config?: ConfigData;
}

const DEFAULT_MIN_PARAMS = 1;  // 1B
const DEFAULT_MAX_PARAMS = 500; // 500B
const DEFAULT_LIMIT = 200;
const DEFAULT_OUTPUT = "src/data/llm-calculator-models.json";

const KNOWN_ARCHITECTURES = new Set([
  "LlamaForCausalLM", "LlamaModel",
  "MistralForCausalLM", "MistralModel",
  "MixtralForCausalLM", "MixtralModel",
  "Qwen2ForCausalLM", "Qwen2Model", "Qwen2MoeForCausalLM",
  "Qwen3ForCausalLM", "Qwen3Model", "Qwen3MoeForCausalLM",
  "GemmaForCausalLM", "Gemma2ForCausalLM", "Gemma3ForCausalLM",
  "PhiForCausalLM", "Phi3ForCausalLM", "Phi4ForCausalLM",
  "DeepseekV2ForCausalLM", "DeepseekV3ForCausalLM",
  "DeepseekV3MoeForCausalLM",
  "MptForCausalLM", "MptModel",
  "FalconForCausalLM", "FalconModel",
  "BloomForCausalLM", "BloomModel",
  "GPTBigCodeForCausalLM", "GPTBigCodeModel",
  "GPTNeoXForCausalLM", "GPTNeoXModel",
  "GPTJForCausalLM", "GPTJModel",
  "StableLmForCausalLM", "StableLmModel",
  "Nemotron3ForCausalLM",
  "CohereForCausalLM",
  "BaichuanForCausalLM",
  "InternLMForCausalLM", "InternLM2ForCausalLM",
  "YiForCausalLM",
  "QwenForCausalLM", "QwenModel",
  "ChatGLMForCausalLM",
  "OPTForCausalLM", "OPTModel",
  "BertGenerationForCausalLM",
]);

const KNOWN_FAMILIES = [
  "llama", "mistral", "mixtral", "qwen", "qwen2", "qwen3",
  "gemma", "gemma2", "gemma3",
  "phi", "phi3", "phi4",
  "deepseek", "deepseek_v2", "deepseek_v3",
  "mpt", "falcon", "bloom", "gpt_bigcode", "gpt_neox", "gpt_j",
  "stablelm", "nemotron", "cohere", "baichuan", "internlm", "yi",
  "opt", "bert_generation",
];

function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string | number | boolean> = {
    minParams: DEFAULT_MIN_PARAMS,
    maxParams: DEFAULT_MAX_PARAMS,
    limit: DEFAULT_LIMIT,
    output: DEFAULT_OUTPUT,
    token: process.env.HF_TOKEN,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--min-params") result.minParams = parseFloat(args[++i]);
    else if (arg === "--max-params") result.maxParams = parseFloat(args[++i]);
    else if (arg === "--limit") result.limit = parseInt(args[++i]);
    else if (arg === "--output") result.output = args[++i];
    else if (arg === "--token") result.token = args[++i];
    else if (arg === "--help" || arg === "-h") {
      console.log(`
Fetch LLM models from Hugging Face Hub for VRAM Calculator

Usage: bun run src/scripts/fetch-hf-models.ts [options]

Options:
  --min-params <B>   Minimum parameters in billions (default: 1)
  --max-params <B>   Maximum parameters in billions (default: 500)
  --limit <N>        Max models to fetch (default: 200)
  --output <path>    Output JSON file (default: src/data/llm-calculator-models.json)
  --token <token>    HF token for gated models (default: HF_TOKEN env var)
  --help, -h         Show this help
`);
      process.exit(0);
    }
  }
  return result;
}

function extractArchitecture(config: ConfigData): Partial<ModelArch> | null {
  // Check top-level config first, then text_config for multimodal models
  const sources: ConfigData[] = [config];
  if (config.text_config && typeof config.text_config === "object") {
    sources.unshift(config.text_config); // prioritize text_config
  }

  let num_hidden_layers: number | null = null;
  let num_attention_heads: number | null = null;
  let num_key_value_heads: number | null = null;
  let head_dim: number | null = null;
  let hidden_size: number | null = null;
  let vocab_size: number | null = null;
  let num_experts: number | null = null;
  let moe_intermediate_size: number | null = null;
  let is_moe = false;

  for (const src of sources) {
    if (num_hidden_layers === null) num_hidden_layers = src.num_hidden_layers ?? null;
    if (num_attention_heads === null) num_attention_heads = src.num_attention_heads ?? null;
    if (num_key_value_heads === null) num_key_value_heads = src.num_key_value_heads ?? null;
    if (head_dim === null) head_dim = src.head_dim ?? null;
    if (hidden_size === null) hidden_size = src.hidden_size ?? null;
    if (vocab_size === null) vocab_size = src.vocab_size ?? null;
    if (num_experts === null) num_experts = src.num_experts ?? src.num_local_experts ?? null;
    if (moe_intermediate_size === null) moe_intermediate_size = src.moe_intermediate_size ?? src.intermediate_size ?? null;
    if (!is_moe) is_moe = !!(src.num_experts || src.num_local_experts);
  }

  // GQA default: if num_key_value_heads missing, assume MHA
  if (num_key_value_heads === null && num_attention_heads !== null) {
    num_key_value_heads = num_attention_heads;
  }

  // Calculate head_dim if missing: hidden_size / num_attention_heads
  if (head_dim === null && hidden_size !== null && num_attention_heads !== null && num_attention_heads > 0) {
    head_dim = Math.floor(hidden_size / num_attention_heads);
  }

  // Validate required fields
  if (num_hidden_layers === null || num_attention_heads === null || head_dim === null) {
    return null;
  }

  // Estimate total parameters from architecture
  let estimatedParams = estimateParamsFromArch({
    hidden_size: hidden_size ?? num_attention_heads * head_dim,
    num_hidden_layers,
    num_attention_heads,
    num_key_value_heads,
    head_dim,
    vocab_size,
    intermediate_size: moe_intermediate_size,
    num_experts: is_moe ? num_experts : undefined,
    is_moe,
  });

  return {
    params: estimatedParams,
    layers: num_hidden_layers,
    attnH: num_attention_heads,
    kvH: num_key_value_heads ?? num_attention_heads,
    dHead: head_dim,
    note: "",
  };
}

function estimateParamsFromArch(arch: {
  hidden_size: number;
  num_hidden_layers: number;
  num_attention_heads: number;
  num_key_value_heads: number;
  head_dim: number;
  vocab_size: number | null;
  intermediate_size: number | null;
  num_experts?: number;
  is_moe?: boolean;
}): number {
  const {
    hidden_size,
    num_hidden_layers,
    num_attention_heads,
    num_key_value_heads,
    head_dim,
    vocab_size,
    intermediate_size,
    num_experts = 1,
    is_moe = false,
  } = arch;

  // Embedding params
  const vocab = vocab_size ?? 128000; // default fallback
  const embedParams = vocab * hidden_size * 2; // embed + lm_head (tied or not)

  // Attention params per layer
  const qParams = hidden_size * num_attention_heads * head_dim;
  const kParams = hidden_size * num_key_value_heads * head_dim;
  const vParams = hidden_size * num_key_value_heads * head_dim;
  const oParams = num_attention_heads * head_dim * hidden_size;
  const attnParamsPerLayer = qParams + kParams + vParams + oParams;

  // FFN params per layer
  const ffnIntermediate = intermediate_size ?? hidden_size * 4;
  let ffnParamsPerLayer = 0;
  
  if (is_moe && num_experts && num_experts > 1) {
    // MoE: gate_up_proj + down_proj per expert
    const expertsPerToken = num_experts;
    const gateUpParams = hidden_size * ffnIntermediate * 2 * expertsPerToken;
    const downParams = ffnIntermediate * hidden_size * expertsPerToken;
    ffnParamsPerLayer = gateUpParams + downParams;
    // Router params (small)
    ffnParamsPerLayer += hidden_size * num_experts;
  } else {
    // Dense: gate + up + down
    const gateParams = hidden_size * ffnIntermediate;
    const upParams = hidden_size * ffnIntermediate;
    const downParams = ffnIntermediate * hidden_size;
    ffnParamsPerLayer = gateParams + upParams + downParams;
  }

  // Norm params per layer (2 RMSNorms typically)
  const normParamsPerLayer = hidden_size * 2;

  const totalLayerParams = attnParamsPerLayer + ffnParamsPerLayer + normParamsPerLayer;
  const totalParams = embedParams + totalLayerParams * num_hidden_layers + hidden_size * 2; // final norm

  return Math.round(totalParams / 1e9 * 10) / 10; // Billions, 1 decimal
}

function formatLabel(repoId: string, arch: Partial<ModelArch>): string {
  const paramsB = Math.round((arch.params ?? 0) * 10) / 10;
  const family = detectFamily(repoId);
  if (family) {
    const size = formatSize(paramsB);
    return `${family} ${size}`;
  }
  // Fallback: extract from repo name
  const parts = repoId.split("/");
  const name = parts[parts.length - 1];
  return `${name} (${paramsB}B)`;
}

function detectFamily(repoId: string): string | null {
  const lower = repoId.toLowerCase();
  const families = [
    "llama", "mistral", "mixtral", "qwen", "gemma", "phi",
    "deepseek", "yi", "baichuan", "internlm", "stablelm",
    "nemotron", "cohere", "falcon", "bloom", "mpt", "opt",
  ];
  for (const fam of families) {
    if (lower.includes(fam)) return fam.charAt(0).toUpperCase() + fam.slice(1);
  }
  return null;
}

function formatSize(paramsB: number): string {
  if (paramsB >= 100) return `${Math.round(paramsB)}B`;
  if (paramsB >= 10) return `${paramsB.toFixed(1).replace(/\.0$/, "")}B`;
  return `${paramsB.toFixed(1).replace(/\.0$/, "")}B`;
}

function generateNote(arch: Partial<ModelArch>): string {
  const { attnH, kvH, is_moe, num_experts } = arch as any;
  if (is_moe && num_experts) {
    const active = num_experts > 1 ? `~${Math.round((arch.params ?? 0) / num_experts * 2 * 10) / 10}B active` : "";
    return `MoE — ${num_experts} experts, ${active}; GQA ${kvH} KV heads, ${attnH} attention heads`;
  }
  if (kvH === attnH) {
    return `MHA — KV heads = attention heads (${attnH})`;
  }
  return `GQA — ${kvH} KV heads, ${attnH} attention heads`;
}

async function fetchConfig(api: HfApi, repoId: string): Promise<ConfigData | null> {
  try {
    const configPath = await api.hf_hub_download({
      repo_id: repoId,
      filename: "config.json",
      repo_type: "model",
    });
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    // Try without revision (some models need specific revision)
    try {
      const configPath = await api.hf_hub_download({
        repo_id: repoId,
        filename: "config.json",
        repo_type: "model",
        revision: "main",
      });
      const content = readFileSync(configPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}

function isValidLLMModel(model: ModelInfo): boolean {
  // Must be text-generation
  if (model.pipeline_tag !== "text-generation") return false;
  
  // Must be transformers-based
  const hasTransformers = model.tags?.some(t => 
    t === "transformers" || t === "pytorch" || t === "safetensors"
  );
  if (!hasTransformers) return false;

  // Skip non-LLM tags
  const skipTags = ["embedding", "reranker", "classification", "retrieval", "sentence-similarity"];
  if (model.tags?.some(t => skipTags.includes(t))) return false;

  return true;
}

function makeKey(arch: ModelArch): string {
  return `${arch.params}|${arch.layers}|${arch.attnH}|${arch.kvH}|${arch.dHead}`;
}

async function main() {
  const args = parseArgs();
  const { minParams, maxParams, limit, output, token } = args;

  console.log(`Fetching LLM models from HF Hub...`);
  console.log(`Params range: ${minParams}B - ${maxParams}B, Limit: ${limit}`);

  const api = new HfApi({
    token: token || undefined,
  });

  // Fetch models with text-generation pipeline tag
  // Use filter for parameter range
  const filter = `params:${minParams}B..${maxParams}B`;
  
  console.log(`Querying models with filter: ${filter}...`);
  
  const models = [];
  for await (const model of api.list_models({
    pipeline_tag: "text-generation",
    filter: filter,
    sort: "downloads",
    direction: -1,
    limit: limit,
    full: true,
    fetch_config: false, // we'll fetch config separately
  })) {
    models.push(model as ModelInfo);
  }

  console.log(`Found ${models.length} models. Fetching configs...`);

  const archMap: Record<string, ModelArch> = {};
  let processed = 0;
  let skipped = 0;

  for (const model of models) {
    if (!isValidLLMModel(model)) {
      skipped++;
      continue;
    }

    const config = await fetchConfig(api, model.id);
    if (!config) {
      skipped++;
      continue;
    }

    // Check if architecture is known
    const archNames = config.architectures || [];
    const isKnownArch = archNames.some(a => KNOWN_ARCHITECTURES.has(a)) ||
                       (config.model_type && KNOWN_FAMILIES.includes(config.model_type));
    
    if (!isKnownArch) {
      skipped++;
      continue;
    }

    const arch = extractArchitecture(config);
    if (!arch) {
      skipped++;
      continue;
    }

    // Check param range
    if (arch.params! < minParams || arch.params! > maxParams) {
      skipped++;
      continue;
    }

    // Deduplicate by architecture key
    const fullArch: ModelArch = {
      label: formatLabel(model.id, arch),
      params: arch.params!,
      layers: arch.layers!,
      attnH: arch.attnH!,
      kvH: arch.kvH!,
      dHead: arch.dHead!,
      note: generateNote(arch),
    };

    const key = makeKey(fullArch);
    if (!archMap[key] || model.downloads > (archMap[key] as any).downloads) {
      (fullArch as any).downloads = model.downloads;
      archMap[key] = fullArch;
    }

    processed++;
    if (processed % 10 === 0) {
      console.log(`  Processed ${processed}/${models.length}...`);
    }
  }

  // Sort by params, then layers
  const sortedArches = Object.values(archMap).sort((a, b) => {
    if (a.params !== b.params) return a.params - b.params;
    return a.layers - b.layers;
  });

  // Output format matching llm-calculator-models.json
  const outputObj: Record<string, ModelArch> = {};
  for (const arch of sortedArches) {
    outputObj[makeKey(arch)] = arch;
  }

  const outputPath = join(process.cwd(), output as string);
  writeFileSync(outputPath, JSON.stringify(outputObj, null, 2));
  
  console.log(`\n✅ Done!`);
  console.log(`   Models processed: ${processed}`);
  console.log(`   Models skipped: ${skipped}`);
  console.log(`   Unique architectures: ${sortedArches.length}`);
  console.log(`   Output: ${outputPath}`);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});