import type { Tool } from '../types';

export interface ToolWithCategory extends Tool {
  category: string | string[];
}

export function categoryValue(tool: ToolWithCategory): string {
  return Array.isArray(tool.category) ? tool.category[0] || '' : tool.category || '';
}

export function enrichTool(tool: ToolWithCategory): ToolWithCategory {
  const category = categoryValue(tool);
  const text = `${tool.title} ${tool.body} ${category}`.toLowerCase();
  const hardware = tool.hardware || [];
  const deployment = tool.deployment || [];
  const modelFormat = tool.model_format || [];
  const lowResource = hardware.some((item) => item.includes('Low-resource'));
  const docker = deployment.includes('Docker');
  const gpuOnly = hardware.length > 0 && hardware.every((item) => item.includes('GPU') || item.includes('CUDA') || item.includes('ROCm'));

  return {
    ...tool,
    plain_description: tool.plain_description || tool.body,
    technical_description: tool.technical_description || tool.body,
    setup_difficulty: tool.setup_difficulty || (lowResource ? 'Low' : docker ? 'Medium' : gpuOnly ? 'High' : 'Medium'),
    use_cases: tool.use_cases || [],
    personas: tool.personas || [],
    commercial_use: tool.commercial_use ?? true,
    offline_after_setup: tool.offline_after_setup ?? true,
    telemetry: tool.telemetry || 'None',
    docker_available: tool.docker_available ?? docker,
    gui_available: tool.gui_available ?? (category === 'chat-interfaces' || text.includes('gui')),
    openai_api: tool.openai_api ?? (text.includes('openai') || text.includes('oai compatible')),
    rest_api: tool.rest_api ?? (text.includes('api') || category === 'deployment'),
    fine_tuning: tool.fine_tuning ?? (category === 'fine-tuning-training' || text.includes('fine-tun')),
    quantization: tool.quantization ?? (modelFormat.some((f) => ['GGUF', 'GPTQ', 'AWQ'].includes(f)) || text.includes('quant')),
    paid_support: tool.paid_support ?? Boolean(tool.url && !tool.url.includes('github.com')),
    min_ram_gb: tool.min_ram_gb || (lowResource ? 8 : gpuOnly ? 16 : 8),
    recommended_ram_gb: tool.recommended_ram_gb || (gpuOnly ? 32 : 16),
    features: tool.features || [],
    community_notes_count: tool.community_notes_count || 0,
    community_guides_count: tool.community_guides_count || 0,
    last_verified: tool.last_verified || tool.last_updated || tool['date-added'],
  };
}

const COMPLEMENTS: Record<string, string[]> = {
  'llm-inference': ['chat-interfaces', 'rag-document', 'deployment', 'monitoring-observability'],
  'llm-models': ['llm-inference', 'chat-interfaces', 'fine-tuning-training'],
  'chat-interfaces': ['llm-inference', 'llm-models', 'rag-document'],
  'rag-document': ['vector-databases', 'embedding-models', 'llm-inference', 'chat-interfaces'],
  'vector-databases': ['embedding-models', 'rag-document'],
  'embedding-models': ['vector-databases', 'rag-document'],
  'fine-tuning-training': ['llm-models', 'deployment', 'monitoring-observability'],
  'workflow-automation': ['agent-frameworks', 'chat-interfaces', 'rag-document'],
  'agent-frameworks': ['llm-inference', 'workflow-automation', 'monitoring-observability'],
};

export function getWorksWith(tool: ToolWithCategory, allTools: ToolWithCategory[], limit = 4): ToolWithCategory[] {
  const category = categoryValue(tool);
  const targetCategories = COMPLEMENTS[category] || [];
  const candidates = allTools
    .map(enrichTool)
    .filter((candidate) => candidate.slug !== tool.slug && targetCategories.includes(categoryValue(candidate)));

  return candidates
    .sort((a, b) => {
      const sharedUseCases = (b.use_cases || []).filter((value) => (tool.use_cases || []).includes(value)).length -
        (a.use_cases || []).filter((value) => (tool.use_cases || []).includes(value)).length;
      if (sharedUseCases !== 0) return sharedUseCases;
      return (b.popularity_score || 0) - (a.popularity_score || 0);
    })
    .slice(0, limit);
}

export const compareRows = [
  ['License', 'license'],
  ['Commercial use', 'commercial_use'],
  ['Setup difficulty', 'setup_difficulty'],
  ['GitHub stars', 'popularity_score'],
  ['Last updated', 'last_updated'],
  ['OpenAI API', 'openai_api'],
  ['REST API', 'rest_api'],
  ['Fine-tuning', 'fine_tuning'],
  ['Quantization', 'quantization'],
  ['Docker', 'docker_available'],
  ['GUI / no-code', 'gui_available'],
  ['Offline after setup', 'offline_after_setup'],
  ['Telemetry', 'telemetry'],
  ['Minimum RAM', 'min_ram_gb'],
  ['Recommended RAM', 'recommended_ram_gb'],
  ['Hardware', 'hardware'],
  ['Deployment', 'deployment'],
  ['Model format', 'model_format'],
] as const;

export function formatCompareValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not specified';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString('en-US');
  if (typeof value === 'string' && value.trim()) return value;
  return 'Not specified';
}
