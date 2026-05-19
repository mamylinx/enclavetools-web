import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import toolsData from '../src/data/tools.json'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const allTools = toolsData.tools.flatMap((cat: { category: string; content: Array<{
    title: string;
    body: string;
    tag?: string;
    url: string;
    'date-added': string;
    slug?: string;
    license?: string;
    language?: string[];
    hardware?: string[];
    deployment?: string[];
    model_format?: string[];
    maturity?: string;
    last_updated?: string;
    github_stars?: number;
    featured?: boolean;
}> }) =>
    cat.content.map((tool) => ({
        name: tool.title,
        slug: tool.slug || tool.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        description: tool.body,
        tag: tool.tag || null,
        url: tool.url,
        category: [cat.category],
        license: tool.license || null,
        language: tool.language || [],
        hardware: tool.hardware || [],
        deployment: tool.deployment || [],
        model_format: tool.model_format || [],
        maturity: tool.maturity || null,
        date_added: tool['date-added'],
        last_updated: tool.last_updated || tool['date-added'],
        popularity_score: tool.github_stars || 0,
        featured: tool.featured || false,
    }))
)

console.log(`Migrating ${allTools.length} tools to Supabase...`)

const CHUNK_SIZE = 100
let inserted = 0
let errors = 0

for (let i = 0; i < allTools.length; i += CHUNK_SIZE) {
    const chunk = allTools.slice(i, i + CHUNK_SIZE)
    const { data, error } = await supabase.from('tools').insert(chunk)

    if (error) {
        console.error(`Error inserting chunk ${i}-${i + chunk.length}:`, error.message)
        errors += chunk.length
    } else {
        inserted += chunk.length
        console.log(`  Inserted ${inserted}/${allTools.length} tools`)
    }
}

console.log(`\nDone! Inserted: ${inserted}, Errors: ${errors}`)
