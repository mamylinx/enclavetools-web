import type { FilterGroupConfig, FilterOption } from '../types';

// export const CATEGORY_OPTIONS: FilterOption[] = [
//     { value: 'llm-models', label: 'LLM Models' },
//     { value: 'embedding-models', label: 'Embedding Models' },
//     { value: 'llm-inference', label: 'Inference Engines' },
//     { value: 'vector-databases', label: 'Vector Databases' },
//     { value: 'frameworks-orchestration', label: 'Frameworks & Orchestration' },
//     { value: 'fine-tuning-training', label: 'Fine-tuning & Training' },
//     { value: 'chat-interfaces', label: 'UI & Chat Interfaces' },
//     { value: 'rag-document', label: 'RAG & Document Processing' },
//     { value: 'agent-frameworks', label: 'Agents & Automation' },
//     { value: 'monitoring-observability', label: 'Monitoring & Observability' },
//     { value: 'privacy-security', label: 'Security & Access Control' },
//     { value: 'deployment', label: 'Utilities & Dev Tools' },
//     { value: 'speech-to-text', label: 'Speech to Text' },
//     { value: 'text-to-speech', label: 'Text to Speech' },
//     { value: 'image-generation', label: 'Image Generation' },
//     { value: 'video-generation', label: 'Video Generation' },
//     { value: 'vision-multimodal', label: 'Vision & Multimodal' },
// ];

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
    // { key: 'category', label: 'Category', type: 'multi', options: CATEGORY_OPTIONS },
    { key: 'license', label: 'License', type: 'multi', options: LICENSE_OPTIONS },
    { key: 'language', label: 'Language / Runtime', type: 'multi', options: LANGUAGE_OPTIONS },
    { key: 'hardware', label: 'Hardware', type: 'multi', options: HARDWARE_OPTIONS },
    { key: 'deployment', label: 'Deployment', type: 'multi', options: DEPLOYMENT_OPTIONS },
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
