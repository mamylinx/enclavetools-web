import { create, insert, save } from '@orama/orama'
import toolsData from '../data/tools.json'
import type { Tool, Category } from '../interfaces/tool'

const SCHEMA = {
  title: 'string',
  slug: 'string',
  body: 'string',
  plain_description: 'string',
  technical_description: 'string',
  tag: 'string',
  url: 'string',
  github_url: 'string',
  docs_url: 'string',
  license: 'string',
  setup_difficulty: 'string',
  maturity: 'string',
  telemetry: 'string',
  category: 'string[]',
  use_cases: 'string[]',
  personas: 'string[]',
  language: 'string[]',
  hardware: 'string[]',
  deployment: 'string[]',
  model_format: 'string[]',
  works_with: 'string[]',
  features: 'string[]',
  commercial_use: 'boolean',
  offline_after_setup: 'boolean',
  openai_api: 'boolean',
  rest_api: 'boolean',
  fine_tuning: 'boolean',
  quantization: 'boolean',
  docker_available: 'boolean',
  gui_available: 'boolean',
  paid_support: 'boolean',
  featured: 'boolean',
  popularity_score: 'number',
}

function sanitize(doc: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, type] of Object.entries(SCHEMA)) {
    let val = doc[key]
    if (val === null || val === undefined) {
      if (type === 'string') result[key] = ''
      else if (type === 'string[]') result[key] = []
      else if (type === 'boolean') result[key] = false
      else if (type === 'number') result[key] = 0
    } else {
      if (type === 'boolean') {
        result[key] = Boolean(val)
      } else if (type === 'number') {
        result[key] = typeof val === 'number' ? val : Number(val) || 0
      } else {
        result[key] = val
      }
    }
  }
  for (const [key, val] of Object.entries(doc)) {
    if (!(key in SCHEMA)) {
      result[key] = val
    }
  }
  return result
}

export async function GET() {
  const catTools = toolsData.tools

  const docs = catTools.flatMap((cat: Category) =>
    cat.content.map((tool: Tool) =>
      sanitize({
        ...tool,
        category: [cat.category],
      }),
    ),
  )

  const db = await create({ schema: SCHEMA })

  for (const doc of docs) {
    await insert(db, doc)
  }

  const index = await save(db)

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  })
}