import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

export interface Tool {
    name: string;
    description: string;
    slug: string;
    tag: string | null;
    url: string;
    category: string[];
    license: string | null;
    language: string[];
    hardware: string[];
    deployment: string[];
    model_format: string[];
    maturity: string | null;
    date_added: string;
    last_updated: string;
    featured: boolean;
    popularity_score: number;
}

export async function fetchAllTools(): Promise<Tool[]> {
    const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('popularity_score', { ascending: false })

    if (error) {
        console.error('Failed to fetch tools from Supabase:', error.message)
        process.exit(1)
    }

    return data || []
}
