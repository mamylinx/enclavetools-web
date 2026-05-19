import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fetchAllTools } from './fetch-tools'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔧 Generating individual tool metadata files...\n')

const metadataPath = path.join(__dirname, '../src/data/metadata.json')
const outputDir = path.join(__dirname, '../src/data/tool-metadata')

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log(`📁 Created directory: ${outputDir}`)
}

try {
    const tools = await fetchAllTools()

    let metadataMap: Record<string, any> = {}
    if (fs.existsSync(metadataPath)) {
        metadataMap = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
        console.log(`✅ Loaded metadata.json with ${Object.keys(metadataMap).length} entries`)
    } else {
        console.log('⚠️  metadata.json not found, will use tool data only')
    }

    let totalFiles = 0
    let totalSize = 0

    tools.forEach((tool) => {
        if (!tool.slug) {
            console.log(`⚠️  Skipping tool without slug: ${tool.name}`)
            return
        }

        const meta = metadataMap[tool.slug] || {}
        const category = (tool.category || [])[0] || ''

        const toolMetadata = {
            title: meta.title || tool.name,
            description: meta.description || tool.description,
            category,
            url: tool.url,
            tag: tool.tag,
            'date-added': tool.date_added,
            slug: tool.slug
        }

        const outputPath = path.join(outputDir, `${tool.slug}.json`)
        const jsonContent = JSON.stringify(toolMetadata, null, 2)
        fs.writeFileSync(outputPath, jsonContent)

        totalFiles++
        totalSize += jsonContent.length
    })

    const avgSize = Math.round(totalSize / totalFiles)
    console.log(`\n✨ Successfully generated ${totalFiles} metadata files`)
    console.log(`📊 Total size: ${(totalSize / 1024).toFixed(2)} KB`)
    console.log(`📊 Average size per file: ${avgSize} bytes (~${(avgSize / 1024).toFixed(2)} KB)`)
    console.log(`📁 Output directory: ${outputDir}`)

    if (fs.existsSync(metadataPath)) {
        const originalSize = fs.statSync(metadataPath).size
        const reduction = ((1 - (totalSize / originalSize)) * 100).toFixed(1)
        console.log(`\n💡 Size comparison:`)
        console.log(`   Original metadata.json: ${(originalSize / 1024).toFixed(2)} KB`)
        console.log(`   New individual files: ${(totalSize / 1024).toFixed(2)} KB`)
        console.log(`   Per-page load: ~${(avgSize / 1024).toFixed(2)} KB (${reduction}% reduction)`)
    }

} catch (error: any) {
    console.error('❌ Error generating tool metadata:', error.message)
    process.exit(1)
}
