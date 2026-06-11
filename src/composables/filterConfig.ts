import type { FilterGroupConfig, FilterOptionValueValue } from '../types';
import categoriesData from '../data/categories.json';
import filterOptions from '../data/filter-options.json';

export const CATEGORY_OPTIONS: FilterOptionValue[] = categoriesData.map(category => ({
    value: category.category,
    label: category.title
}));

const opts = filterOptions as Record<string, Array<{ value: string; label: string }>>;

export const USE_CASE_OPTIONS: FilterOptionValue[] = opts.use_case || [];
export const PERSONA_OPTIONS: FilterOptionValue[] = opts.persona || [];
export const SETUP_OPTIONS: FilterOptionValue[] = opts.setup_difficulty || [];
export const LICENSE_OPTIONS: FilterOptionValue[] = opts.license || [
  { value: 'MIT', label: 'MIT' },
  { value: 'Apache 2.0', label: 'Apache 2.0' },
  { value: 'GPL / LGPL', label: 'GPL / LGPL' },
  { value: 'BSD', label: 'BSD' },
  { value: 'Commercial-Friendly', label: 'Commercial-Friendly' },
  { value: 'Restricted / Custom', label: 'Restricted / Custom' },
];
export const MATURITY_OPTIONS: FilterOptionValue[] = opts.maturity || [
  { value: 'Production / Stable', label: 'Production / Stable' },
  { value: 'Beta', label: 'Beta' },
  { value: 'Experimental', label: 'Experimental' },
  { value: 'Archived / Unmaintained', label: 'Archived / Unmaintained' },
];
export const TELEMETRY_OPTIONS: FilterOptionValue[] = opts.telemetry
  ? [{ value: '', label: 'Any' }, ...opts.telemetry.map((o) => ({ value: o.value, label: o.label === 'None' ? 'None only' : o.label }))]
  : [{ value: '', label: 'Any' }, { value: 'None', label: 'None only' }];

export const LANGUAGE_OPTIONS: FilterOptionValue[] = [
  { value: 'Python', label: 'Python' },
  { value: 'Rust', label: 'Rust' },
  { value: 'Go', label: 'Go' },
  { value: 'TypeScript / JavaScript', label: 'TypeScript / JavaScript' },
  { value: 'C / C++', label: 'C / C++' },
  { value: 'Java / Kotlin', label: 'Java / Kotlin' },
];

export const HARDWARE_OPTIONS: FilterOptionValue[] = [
  { value: 'CPU Only', label: 'CPU Only' },
  { value: 'NVIDIA GPU (CUDA)', label: 'NVIDIA GPU (CUDA)' },
  { value: 'AMD GPU (ROCm)', label: 'AMD GPU (ROCm)' },
  { value: 'Apple Silicon (Metal)', label: 'Apple Silicon (Metal)' },
  { value: 'Low-resource (< 8GB RAM)', label: 'Low-resource (< 8GB RAM)' },
];

export const DEPLOYMENT_OPTIONS: FilterOptionValue[] = [
  { value: 'Docker', label: 'Docker' },
  { value: 'Bare Metal', label: 'Bare Metal' },
  { value: 'Kubernetes', label: 'Kubernetes' },
  { value: 'Systemd / Linux Service', label: 'Systemd / Linux Service' },
  { value: 'Embedded / Edge', label: 'Embedded / Edge' },
];

export const MODEL_FORMAT_OPTIONS: FilterOptionValue[] = [
  { value: 'GGUF', label: 'GGUF' },
  { value: 'GPTQ', label: 'GPTQ' },
  { value: 'AWQ', label: 'AWQ' },
  { value: 'Safetensors', label: 'Safetensors' },
  { value: 'ONNX', label: 'ONNX' },
];

export const FEATURE_OPTIONS: FilterOptionValue[] = [
  { value: 'openai_api', label: 'OpenAI-compatible API' },
  { value: 'rest_api', label: 'REST API' },
  { value: 'fine_tuning', label: 'Fine-tuning' },
  { value: 'quantization', label: 'Quantization' },
  { value: 'docker_available', label: 'Docker available' },
  { value: 'gui_available', label: 'GUI / No-code' },
  { value: 'paid_support', label: 'Paid support' },
];

export const YES_ONLY_OPTIONS: FilterOptionValue[] = [
  { value: '', label: 'Any' },
  { value: 'yes', label: 'Yes only' },
];

export const LAST_UPDATED_OPTIONS: FilterOptionValue[] = [
  { value: null, label: 'Any time' },
  { value: '30d', label: 'Past 30 days' },
  { value: '6m', label: 'Past 6 months' },
  { value: '1y', label: 'Past 1 year' },
];

export const FILTER_GROUPS: FilterGroupConfig[] = [
  { key: 'category', label: 'Category', type: 'multi', options: CATEGORY_OPTIONS },
  { key: 'use_case', label: 'Use Case', type: 'multi', options: USE_CASE_OPTIONS },
  { key: 'persona', label: 'Persona', type: 'multi', options: PERSONA_OPTIONS },
  { key: 'setup_difficulty', label: 'Setup Difficulty', type: 'multi', options: SETUP_OPTIONS },
  { key: 'license', label: 'License', type: 'multi', options: LICENSE_OPTIONS },
  { key: 'language', label: 'Language / Runtime', type: 'multi', options: LANGUAGE_OPTIONS },
  { key: 'hardware', label: 'Hardware', type: 'multi', options: HARDWARE_OPTIONS },
  { key: 'deployment', label: 'Deployment', type: 'multi', options: DEPLOYMENT_OPTIONS },
  { key: 'features', label: 'Features', type: 'multi', options: FEATURE_OPTIONS },
  { key: 'commercial_use', label: 'Commercial Use', type: 'single', options: YES_ONLY_OPTIONS },
  { key: 'offline_after_setup', label: 'Offline After Setup', type: 'single', options: YES_ONLY_OPTIONS },
  { key: 'telemetry', label: 'Telemetry', type: 'single', options: TELEMETRY_OPTIONS },
  {
      key: 'model_format',
      label: 'Model Format',
      type: 'multi',
      options: MODEL_FORMAT_OPTIONS,
  },
  { key: 'last_updated', label: 'Last Updated', type: 'single', options: LAST_UPDATED_OPTIONS },
];

export const MODEL_FORMAT_CATEGORIES = ['llm-models', 'embedding-models'];
