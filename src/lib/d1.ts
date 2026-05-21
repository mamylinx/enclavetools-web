export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  url: string | null;
  github_url: string | null;
  category: string;
  license: string | null;
  language: string; // JSON array string
  hardware: string; // JSON array string
  deployment: string; // JSON array string
  model_format: string; // JSON array string
  maturity: string | null;
  featured: number;
  popularity_score: number;
  date_added: string;
  last_updated: string;
  logo_source: string;
  created_at: string;
}

export interface PendingTool extends Tool {
  logo_r2_key: string | null;
  github_data: string | null; // JSON string
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
}
