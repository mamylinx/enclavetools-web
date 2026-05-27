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
    community_guides?: Array<{
        title: string;
        url: string;
        author?: string;
        format?: string;
        date?: string;
        description?: string;
    }>;
    community_notes?: Array<{
        category: string;
        text: string;
        upvotes?: number;
        date?: string;
        url?: string;
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
    options: FilterOption[];
    conditional?: {
        group: keyof FilterState;
        values: string[];
    };
}

export interface FilterOption {
    value: string | null;
    label: string;
}

export interface FilterResult {
    tools: Tool[];
    total: number;
}
