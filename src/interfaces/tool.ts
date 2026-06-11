export interface Tool {
  title: string;
  body: string;
  plain_description?: string;
  technical_description?: string;
  tag?: string;
  url: string;
  github_url?: string;
  "date-added": string;
  slug?: string;
  license?: string;
  commercial_use?: boolean;
  language?: string[];
  hardware?: string[];
  deployment?: string[];
  model_format?: string[];
  maturity?: string;
  last_updated?: string;
  setup_difficulty?: 'Low' | 'Medium' | 'High' | string;
  use_cases?: string[];
  personas?: string[];
  features?: string[];
  works_with?: string[];
  docs_url?: string;
  community_notes?: Array<{
    category: string;
    text: string;
    upvotes?: number;
    date?: string;
    url?: string;
  }>;
  community_guides?: Array<{
    title: string;
    url: string;
    author?: string;
    format?: string;
    date?: string;
    description?: string;
  }>;
  min_ram_gb?: number;
  recommended_ram_gb?: number;
  telemetry?: 'None' | 'Optional' | 'On by default' | string;
  offline_after_setup?: boolean;
  paid_support?: boolean;
  gui_available?: boolean;
  docker_available?: boolean;
  openai_api?: boolean;
  rest_api?: boolean;
  fine_tuning?: boolean;
  quantization?: boolean;
  community_notes_count?: number;
  community_guides_count?: number;
  last_verified?: string;
  featured?: boolean;
  popularity_score?: number;
}

export interface D1Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  url: string | null;
  github_url: string | null;
  category: string;
  license: string | null;
  language: string;
  hardware: string;
  deployment: string;
  model_format: string;
  maturity: string | null;
  featured: number;
  popularity_score: number;
  date_added: string;
  last_updated: string;
  logo_source: string;
  created_at: string;
  plain_description: string | null;
  technical_description: string | null;
  commercial_use: number | null;
  setup_difficulty: string | null;
  use_cases: string | null;
  personas: string | null;
  features: string | null;
  works_with: string | null;
  docs_url: string | null;
  community_guides: string | null;
  community_notes: string | null;
  min_ram_gb: number | null;
  recommended_ram_gb: number | null;
  telemetry: string | null;
  offline_after_setup: number | null;
  paid_support: number | null;
  gui_available: number | null;
  docker_available: number | null;
  openai_api: number | null;
  rest_api: number | null;
  fine_tuning: number | null;
  quantization: number | null;
  community_notes_count: number | null;
  community_guides_count: number | null;
  last_verified: string | null;
}

export interface PendingTool extends D1Tool {
  logo_r2_key: string | null;
  github_data: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
}

export interface ToolWithCategory extends Tool {
  category: string | string[];
}

export interface BookmarkedTool extends Tool {
  category: string;
}

export interface Category {
  category: string;
  title: string;
  content: Tool[];
}

export interface ToolsConfig {
  tools: Category[];
}

export interface FilterState {
  sort: string;
  category: string[];
  use_case: string[];
  persona: string[];
  setup_difficulty: string[];
  license: string[];
  language: string[];
  hardware: string[];
  deployment: string[];
  model_format: string[];
  maturity: string[];
  features: string[];
  commercial_use: string | null;
  offline_after_setup: string | null;
  telemetry: string | null;
  last_updated: string | null;
}

export interface FilterGroupConfig {
  key: keyof FilterState;
  label: string;
  type: 'single' | 'multi';
  options: FilterOptionValue[];
  conditional?: {
    group: keyof FilterState;
    values: string[];
  };
}

export interface FilterOptionValue {
  value: string | null;
  label: string;
}

export interface FilterResult {
  tools: Tool[];
  total: number;
}
