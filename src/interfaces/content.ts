export interface SiteContent {
  key: string;
  value: string;
  updated_at?: string;
}

export interface SiteContentMap {
  [key: string]: string;
}

export interface MarketingCard {
  id: number;
  type: 'featured' | 'promoted' | 'sponsor';
  label: string | null;
  title: string;
  description: string;
  cta: string | null;
  url: string | null;
  logo: string | null;
  sort_order: number;
  active: number;
  updated_at?: string;
}

export interface MarketingConfig {
  featured: MarketingCard[];
  promoted: MarketingCard[];
  sponsors: MarketingCard[];
}

export interface D1FilterOption {
  id: number;
  group_key: string;
  value: string;
  label: string;
  sort_order: number;
  active: number;
  updated_at?: string;
}

export interface FilterOptionsByGroup {
  [groupKey: string]: D1FilterOption[];
}

export interface CategoryMeta {
  category_slug: string;
  title: string;
  description: string | null;
  icon_name: string | null;
  og_image: string | null;
  sort_order: number;
  updated_at?: string;
}

export interface CategoryIconMap {
  [categorySlug: string]: string;
}

export interface LegalPage {
  slug: string;
  title: string;
  body: string;
  updated_at?: string;
}
