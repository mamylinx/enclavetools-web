export interface ToolCore {
  title: string;
  body: string;
  plain_description: string;
  technical_description: string;
  tag: string;
  url: string;
  github_url?: string;
  "date-added": string;
  slug: string;
  license?: string;
  maturity?: string;
  last_updated?: string;
  setup_difficulty: 'Low' | 'Medium' | 'High' | string;
  docs_url: string;
  featured: boolean;
  popularity_score?: number;
  last_verified: string;
}

export interface ToolDiscovery {
  language: string[];
  hardware: string[];
  deployment: string[];
  model_format: string[];
  use_cases: string[];
  personas: string[];
  features: string[];
  works_with: string[];
  commercial_use: boolean;
}

export interface ToolCapabilities {
  telemetry: 'None' | 'Optional' | 'On by default' | string;
  offline_after_setup: boolean;
  paid_support: boolean;
  gui_available: boolean;
  docker_available: boolean;
  openai_api: boolean;
  rest_api: boolean;
  fine_tuning: boolean;
  quantization: boolean;
}

export interface ToolHardware {
  min_ram_gb: number;
  recommended_ram_gb: number;
}

export interface ToolCommunity {
  community_notes: Array<{
    category: string;
    text: string;
    upvotes?: number;
    date?: string;
    url?: string;
  }>;
  community_guides: Array<{
    title: string;
    url: string;
    author?: string;
    format?: string;
    date?: string;
    description?: string;
  }>;
  community_notes_count: number;
  community_guides_count: number;
}
