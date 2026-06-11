export interface MetadataEntry {
  slug: string;
  title?: string;
  description?: string;
  ogImage?: string;
  twitterHandle?: string;
  githubUrl?: string;
}

export type MetadataMap = Record<string, MetadataEntry>;

export type SlugMap = Record<string, string[]>;

export interface Sponsor {
  logo: string;
  description: string;
  cta: string;
  url: string;
}

export interface PromotedAd {
  label: string;
  title: string;
  description: string;
  cta: string;
  url: string;
}

export interface FeaturedCTA {
  title: string;
  description: string;
  cta: string;
  url: string;
}

export interface SponsorsConfig {
  sponsors: Sponsor[];
}

export interface PromotedConfig {
  ads: PromotedAd[];
}

export interface FeaturedConfig {
  title: string;
  description: string;
  cta: string;
  url: string;
}

export interface NewsletterData {
  title: string;
  subtitle: string;
  placeholder: string;
}

export interface GitHubRepoData {
  stargazers_count?: number;
  stars?: number;
  language?: string;
  owner?: {
    avatar_url?: string;
  };
  name?: string;
  description?: string;
  license?: string;
  avatar_url?: string;
  [key: string]: unknown;
}
