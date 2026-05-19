import { fetchAllTools } from './fetch-tools'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

try {
    const tools = await fetchAllTools()
    const missingSlugs = tools.filter(t => !t.slug)

    if (missingSlugs.length > 0) {
        console.log(`⚠️  Found ${missingSlugs.length} tools without slugs`)
        missingSlugs.forEach(t => console.log(`   - ${t.name}`))
    } else {
        console.log('✅ All tools have slugs')
    }
} catch (error: any) {
    console.error('❌ Error checking slugs:', error.message)
}
