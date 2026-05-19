import { fetchAllTools } from './fetch-tools'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Splitting tools by category...\n')

const outputDir = path.join(__dirname, '../src/data/tools')

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log(`📁 Created directory: ${outputDir}`)
}

try {
    const tools = await fetchAllTools()

    const byCategory = new Map<string, any[]>()
    tools.forEach((tool) => {
        const cats = tool.category || ['uncategorized']
        cats.forEach((cat) => {
            if (!byCategory.has(cat)) byCategory.set(cat, [])
            byCategory.get(cat)!.push({
                title: tool.name,
                body: tool.description,
                tag: tool.tag,
                url: tool.url,
                'date-added': tool.date_added,
                slug: tool.slug,
                license: tool.license,
                language: tool.language,
                hardware: tool.hardware,
                deployment: tool.deployment,
                model_format: tool.model_format,
                maturity: tool.maturity,
                last_updated: tool.last_updated,
                featured: tool.featured,
                popularity_score: tool.popularity_score,
            })
        })
    })

    let categoryCount = 0
    let toolCount = 0

    byCategory.forEach((categoryTools, categoryName) => {
        categoryTools.sort((a, b) => a.title.localeCompare(b.title))
        const outputPath = path.join(outputDir, `${categoryName}.json`)
        fs.writeFileSync(outputPath, JSON.stringify(categoryTools, null, 2))
        categoryCount++
        toolCount += categoryTools.length
        console.log(`✅ Processed "${categoryName}" -> ${categoryName}.json (${categoryTools.length} tools)`)
    })

    console.log(`\n✨ Successfully split ${toolCount} tools into ${categoryCount} category files.`)

} catch (error: any) {
    console.error('❌ Error splitting data:', error.message)
    process.exit(1)
}
