import type { FilterGroupConfig, FilterOption } from '../types';

export const CATEGORY_OPTIONS: FilterOption[] = [
    { value: 'llm-inference', label: 'Inference Engines' },
    { value: 'llm-models', label: 'LLM Models' },
    { value: 'chat-interfaces', label: 'Chat Interfaces' },
    { value: 'rag-document', label: 'Document Processing' },
    { value: 'vector-databases', label: 'Vector Stores' },
    { value: 'embedding-models', label: 'Embeddings' },
    { value: 'fine-tuning-training', label: 'Fine-tuning' },
    { value: 'agent-frameworks', label: 'Agents' },
    { value: 'workflow-automation', label: 'Workflow Automation' },
    { value: 'privacy-security', label: 'Privacy & Security' },
    { value: 'speech-to-text', label: 'Speech to Text' },
    { value: 'text-to-speech', label: 'Text to Speech' },
    { value: 'deployment', label: 'Deployment' },
];

export const USE_CASE_OPTIONS: FilterOption[] = [
    { value: 'Document Processing', label: 'Document Processing' },
    { value: 'Internal Search', label: 'Internal Search' },
    { value: 'Clinical Notes', label: 'Clinical Notes' },
    { value: 'Contract Review', label: 'Contract Review' },
    { value: 'Self-hosted Inference', label: 'Self-hosted Inference' },
    { value: 'Workflow Automation', label: 'Workflow Automation' },
];

export const PERSONA_OPTIONS: FilterOption[] = [
    { value: 'Developer', label: 'Developer' },
    { value: 'Business Owner', label: 'Business Owner' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Legal', label: 'Legal' },
    { value: 'Indie Hacker', label: 'Indie Hacker' },
];

export const SETUP_OPTIONS: FilterOption[] = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
];

export const LICENSE_OPTIONS: FilterOption[] = [
    { value: 'MIT', label: 'MIT' },
    { value: 'Apache 2.0', label: 'Apache 2.0' },
    { value: 'GPL / LGPL', label: 'GPL / LGPL' },
    { value: 'BSD', label: 'BSD' },
    { value: 'Commercial-Friendly', label: 'Commercial-Friendly' },
    { value: 'Restricted / Custom', label: 'Restricted / Custom' },
];

export const LANGUAGE_OPTIONS: FilterOption[] = [
    { value: 'Python', label: 'Python' },
    { value: 'Rust', label: 'Rust' },
    { value: 'Go', label: 'Go' },
    { value: 'TypeScript / JavaScript', label: 'TypeScript / JavaScript' },
    { value: 'C / C++', label: 'C / C++' },
    { value: 'Java / Kotlin', label: 'Java / Kotlin' },
];

export const HARDWARE_OPTIONS: FilterOption[] = [
    { value: 'CPU Only', label: 'CPU Only' },
    { value: 'NVIDIA GPU (CUDA)', label: 'NVIDIA GPU (CUDA)' },
    { value: 'AMD GPU (ROCm)', label: 'AMD GPU (ROCm)' },
    { value: 'Apple Silicon (Metal)', label: 'Apple Silicon (Metal)' },
    { value: 'Low-resource (< 8GB RAM)', label: 'Low-resource (< 8GB RAM)' },
];

export const DEPLOYMENT_OPTIONS: FilterOption[] = [
    { value: 'Docker', label: 'Docker' },
    { value: 'Bare Metal', label: 'Bare Metal' },
    { value: 'Kubernetes', label: 'Kubernetes' },
    { value: 'Systemd / Linux Service', label: 'Systemd / Linux Service' },
    { value: 'Embedded / Edge', label: 'Embedded / Edge' },
];

export const MODEL_FORMAT_OPTIONS: FilterOption[] = [
    { value: 'GGUF', label: 'GGUF' },
    { value: 'GPTQ', label: 'GPTQ' },
    { value: 'AWQ', label: 'AWQ' },
    { value: 'Safetensors', label: 'Safetensors' },
    { value: 'ONNX', label: 'ONNX' },
];

export const FEATURE_OPTIONS: FilterOption[] = [
    { value: 'openai_api', label: 'OpenAI-compatible API' },
    { value: 'rest_api', label: 'REST API' },
    { value: 'fine_tuning', label: 'Fine-tuning' },
    { value: 'quantization', label: 'Quantization' },
    { value: 'docker_available', label: 'Docker available' },
    { value: 'gui_available', label: 'GUI / No-code' },
    { value: 'paid_support', label: 'Paid support' },
];

export const YES_ONLY_OPTIONS: FilterOption[] = [
    { value: '', label: 'Any' },
    { value: 'yes', label: 'Yes only' },
];

export const TELEMETRY_OPTIONS: FilterOption[] = [
    { value: '', label: 'Any' },
    { value: 'None', label: 'None only' },
];

export const MATURITY_OPTIONS: FilterOption[] = [
    { value: 'Production / Stable', label: 'Production / Stable' },
    { value: 'Beta', label: 'Beta' },
    { value: 'Experimental', label: 'Experimental' },
    { value: 'Archived / Unmaintained', label: 'Archived / Unmaintained' },
];

export const LAST_UPDATED_OPTIONS: FilterOption[] = [
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
        // conditional: { group: 'category', values: ['llm-models', 'embedding-models'] },
    },
    { key: 'last_updated', label: 'Last Updated', type: 'single', options: LAST_UPDATED_OPTIONS },
];

export const MODEL_FORMAT_CATEGORIES = ['llm-models', 'embedding-models'];
