export interface Tool {
    title: string;
    body: string;
    tag?: string;
    url: string;
    "date-added": string;
    slug?: string;
    license?: string;
    language?: string[];
    hardware?: string[];
    deployment?: string[];
    model_format?: string[];
    maturity?: string;
    last_updated?: string;
    featured?: boolean;
    popularity_score?: number;
}

export interface Category {
    category: string;
    title: string;
    content: Tool[];
}

export interface ToolsConfig {
    tools: Category[];
}

export interface MetadataEntry {
    slug: string;
    title?: string | undefined;
    description?: string | undefined;
    ogImage?: string | undefined;
    twitterHandle?: string | undefined;
    githubUrl?: string | undefined;
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

export interface TrendingItem {
    name: string;
    price: string;
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

export interface TrendingConfig {
    items: TrendingItem[];
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

export interface FilterState {
    sort: string;
    category: string[];
    license: string[];
    language: string[];
    hardware: string[];
    deployment: string[];
    model_format: string[];
    maturity: string[];
    last_updated: string | null;
}

export interface FilterGroupConfig {
    key: keyof FilterState;
    label: string;
    type: 'single' | 'multi';
    options: FilterOption[];
    conditional?: {
        group: keyof FilterState;
        values: string[];
    };
}

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterResult {
    tools: Tool[];
    total: number;
}
