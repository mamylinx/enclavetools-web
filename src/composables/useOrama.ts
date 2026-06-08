import { create, load, search } from '@orama/orama'
import type { FilterState } from '../types'
import type { ToolWithCategory } from '../utils/toolModel'
import { toolComparators } from '../utils/sorting'

let oramaInstance: any = null
let loadingPromise: Promise<void> | null = null

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

async function getOrama() {
  if (oramaInstance) return oramaInstance
  if (!loadingPromise) {
    loadingPromise = (async () => {
      const res = await fetch('/search-index.json')
      const data = await res.json()
      oramaInstance = await create({ schema: SCHEMA })
      await load(oramaInstance, data)
    })()
  }
  await loadingPromise
  return oramaInstance
}

function matchesDateFilter(tool: ToolWithCategory, lastUpdated: string): boolean {
  const ts = tool.last_updated || tool['date-added']
  if (!ts) return false
  const now = Date.now()
  const updated = new Date(ts).getTime()
  const diff = now - updated
  if (lastUpdated === '30d') return diff <= 30 * 24 * 60 * 60 * 1000
  if (lastUpdated === '6m') return diff <= 180 * 24 * 60 * 60 * 1000
  if (lastUpdated === '1y') return diff <= 365 * 24 * 60 * 60 * 1000
  return true
}

function intersection(arr1: string[], arr2: string[]): boolean {
  return arr2.length === 0 || arr2.some((v) => arr1.includes(v))
}

function postFilter(tools: ToolWithCategory[], filters: FilterState): ToolWithCategory[] {
  return tools.filter((tool) => {
    if (filters.category.length > 0) {
      const cats = Array.isArray(tool.category) ? tool.category : [tool.category]
      if (!filters.category.some((c) => cats.includes(c))) return false
    }
    if (filters.use_case.length > 0) {
      if (!intersection(tool.use_cases || [], filters.use_case)) return false
    }
    if (filters.persona.length > 0) {
      if (!intersection(tool.personas || [], filters.persona)) return false
    }
    if (filters.setup_difficulty.length > 0) {
      if (!filters.setup_difficulty.includes(tool.setup_difficulty || '')) return false
    }
    if (filters.license.length > 0) {
      if (!filters.license.includes(tool.license || '')) return false
    }
    if (filters.language.length > 0) {
      if (!intersection(tool.language || [], filters.language)) return false
    }
    if (filters.hardware.length > 0) {
      if (!intersection(tool.hardware || [], filters.hardware)) return false
    }
    if (filters.deployment.length > 0) {
      if (!intersection(tool.deployment || [], filters.deployment)) return false
    }
    if (filters.model_format.length > 0) {
      if (!intersection(tool.model_format || [], filters.model_format)) return false
    }
    if (filters.maturity.length > 0) {
      if (!filters.maturity.includes(tool.maturity || '')) return false
    }
    if (filters.features.length > 0) {
      if (!filters.features.every((f) => Boolean((tool as Record<string, unknown>)[f]))) return false
    }
    if (filters.commercial_use === 'yes' && !tool.commercial_use) return false
    if (filters.offline_after_setup === 'yes' && !tool.offline_after_setup) return false
    if (filters.telemetry === 'None' && tool.telemetry !== 'None') return false
    if (filters.last_updated && !matchesDateFilter(tool, filters.last_updated)) return false
    return true
  })
}

export type OramaSearchParams = {
  urlCategory: string
  filters: FilterState
  term?: string
  sort?: string
  limit?: number
  offset?: number
}

export type OramaSearchResult = {
  tools: ToolWithCategory[]
  total: number
}

export async function searchTools(params: OramaSearchParams): Promise<OramaSearchResult> {
  const db = await getOrama()

  const where: Record<string, unknown> = {}

  if (params.filters.commercial_use === 'yes') where.commercial_use = true
  if (params.filters.offline_after_setup === 'yes') where.offline_after_setup = true
  if (params.filters.telemetry === 'None') where.telemetry = 'None'
  for (const feat of params.filters.features) {
    where[feat] = true
  }

  const searchOpts: Record<string, unknown> = {
    limit: 1000,
    offset: 0,
  }

  if (params.term && params.term.trim()) {
    searchOpts.term = params.term.trim()
    searchOpts.properties = ['title', 'plain_description']
    searchOpts.boost = { title: 3 }
    searchOpts.where = where as any
  } else {
    searchOpts.where = where as any
  }

  const results = await search(db, searchOpts)

  let tools = results.hits.map((h: any) => h.document) as ToolWithCategory[]

  tools = postFilter(tools, params.filters)

  if (params.urlCategory !== 'all') {
    tools = tools.filter((tool) => {
      const cats = Array.isArray(tool.category) ? tool.category : [tool.category]
      return cats.includes(params.urlCategory)
    })
  }

  const sortKey = params.sort as keyof typeof toolComparators
  if (sortKey && toolComparators[sortKey]) {
    tools = [...tools].sort(toolComparators[sortKey])
  }

  const total = tools.length
  const limit = params.limit ?? 25
  const offset = params.offset ?? 0
  tools = tools.slice(offset, offset + limit)

  return { tools, total }
}

export async function searchDropdown(term: string) {
  const db = await getOrama()

  const results = await search(db, {
    term,
    properties: ['title', 'plain_description'],
    boost: { title: 3 },
    limit: 8,
    threshold: 0.3,
  })

  return results.hits.map((h: any) => ({
    title: h.document.title,
    slug: h.document.slug,
    category: Array.isArray(h.document.category) ? h.document.category[0] : h.document.category,
    plain_description: h.document.plain_description || '',
  }))
}
