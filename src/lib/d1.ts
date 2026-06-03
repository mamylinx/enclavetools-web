export interface Tool {
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

export interface PendingTool extends Tool {
  logo_r2_key: string | null;
  github_data: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
}
