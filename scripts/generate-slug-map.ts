import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fetchAllTools } from './fetch-tools'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🗺️  Generating slug-to-category mapping...\n')

try {
    const tools = await fetchAllTools()
    const slugMap: Record<string, string[]> = {}
    let totalSlugs = 0
    const duplicates: { slug: string; categories: string[] }[] = []

    tools.forEach((tool) => {
        if (tool.slug) {
            const slug = tool.slug
            const categories = tool.category || []

            if (!slugMap[slug]) {
                slugMap[slug] = [...categories]
            } else {
                categories.forEach(c => {
                    if (!slugMap[slug].includes(c)) {
                        slugMap[slug].push(c)
                    }
                })
            }
            totalSlugs++
        }
    })

    Object.entries(slugMap).forEach(([slug, categories]) => {
        if (categories.length > 1) {
            duplicates.push({ slug, categories })
        }
    })

    const outputPath = path.join(__dirname, '../src/data/slug-map.json')
    fs.writeFileSync(outputPath, JSON.stringify(slugMap, null, 2))
    console.log(`✅ Generated slug map with ${totalSlugs} entries`)

    if (duplicates.length > 0) {
        console.log(`\n⚠️  Warning: Found ${duplicates.length} duplicate slugs:`)
        duplicates.forEach(dup => {
            console.log(`   - ${dup.slug}: ${dup.categories.join(', ')}`)
        })
    } else {
        console.log('✅ No duplicate slugs found')
    }

    console.log(`\n✅ Slug map saved to: ${outputPath}`)
} catch (error: any) {
    console.error(`❌ Error generating slug map:`, error.message)
    process.exit(1)
}
