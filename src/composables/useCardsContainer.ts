import { ref, computed, watch } from 'vue'
import { randomSidebarPositions } from '../utils/randomSidebarPositions'
import { toolComparators } from '../utils/sorting'
import { isRecentlyAdded } from '../utils/dates'
import { searchTools } from './useOrama'
import marketingData from '../data/marketing.json'
import type { ToolWithCategory } from '../utils/toolModel'
import type { FilterState } from '../types'
import type { SortKey } from '../utils/sorting'
import type { MarketingConfig } from '../interfaces/content'

const m = marketingData as MarketingConfig

export function useCardsContainer(
  props: {
    filter: string
    sort?: SortKey
    randomSeed?: number
    searchQuery?: string
    filterNew?: boolean
    filterState?: FilterState
    ssrTools?: ToolWithCategory[]
    ssrTotal?: number
  },
  _emit: (event: 'clear-all') => void,
) {
  const promotedAds = ref(m.promoted || [])
  const sponsor = ref(m.sponsors?.[0] || null)

  const activeSort = ref<string>('featured')
  const currentPage = ref(1)
  const oramaResults = ref<ToolWithCategory[]>([])
  const oramaTotal = ref(0)
  const isSearching = ref(false)

  const baseTools = computed((): ToolWithCategory[] => {
    if (props.ssrTools && props.ssrTools.length > 0) return props.ssrTools
    return []
  })

  function hasActiveFilters(filterState: FilterState): boolean {
    return (
      filterState.sort !== 'featured' ||
      filterState.category.length > 0 ||
      filterState.use_case.length > 0 ||
      filterState.persona.length > 0 ||
      filterState.setup_difficulty.length > 0 ||
      filterState.license.length > 0 ||
      filterState.language.length > 0 ||
      filterState.hardware.length > 0 ||
      filterState.deployment.length > 0 ||
      filterState.model_format.length > 0 ||
      filterState.maturity.length > 0 ||
      filterState.features.length > 0 ||
      filterState.commercial_use !== null ||
      filterState.offline_after_setup !== null ||
      filterState.telemetry !== null ||
      filterState.last_updated !== null
    )
  }

  const isOramaActive = computed(() => {
    if (!props.filterState) return false
    return hasActiveFilters(props.filterState) || (!!props.searchQuery && props.searchQuery.length >= 2)
  })

  const filteredCards = computed((): ToolWithCategory[] => {
    if (isOramaActive.value) {
      if (isSearching.value) return baseTools.value
      return oramaResults.value
    }
    let base = baseTools.value
    if (props.filter !== 'all') {
      base = base.filter((tool) => {
        const cats = Array.isArray(tool.category) ? tool.category : [tool.category]
        return cats.includes(props.filter)
      })
    }
    if (props.filterNew) {
      base = base.filter((tool) => isRecentlyAdded(tool['date-added'], 30))
    }
    const comparator = toolComparators[activeSort.value as keyof typeof toolComparators]
    if (comparator) base = [...base].sort(comparator)
    return base
  })

  const toolCount = computed(() => {
    if (isOramaActive.value) return oramaTotal.value
    return filteredCards.value.length
  })

  const totalPages = computed(() => Math.ceil(oramaTotal.value / 25))

  const isSearchingInCategory = computed(
    () => props.searchQuery && props.searchQuery.length >= 2 && props.filter !== 'all',
  )

  const hasNoSearchResults = computed(
    () => isSearchingInCategory.value && filteredCards.value.length === 0,
  )

  const hasNoFilterResults = computed(
    () => isOramaActive.value && !isSearching.value && filteredCards.value.length === 0,
  )

  const positions = randomSidebarPositions(computed(() => filteredCards.value.length))

  const setSort = (sort: string) => {
    activeSort.value = sort
    if (props.filterState) props.filterState.sort = sort
  }

  const goToPage = (page: number) => {
    currentPage.value = page
  }

  async function runOramaSearch() {
    if (!props.filterState) return
    const isActive = hasActiveFilters(props.filterState) || (!!props.searchQuery && props.searchQuery.length >= 2)
    if (!isActive) {
      oramaResults.value = []
      oramaTotal.value = 0
      return
    }
    isSearching.value = true
    try {
      const result = await searchTools({
        urlCategory: props.filter,
        filters: props.filterState,
        term: props.searchQuery,
        sort: activeSort.value,
        limit: 25,
        offset: (currentPage.value - 1) * 25,
      })
      oramaResults.value = result.tools
      oramaTotal.value = result.total
    } catch (e) {
      console.error('Orama search failed:', e)
    } finally {
      isSearching.value = false
    }
  }

  const filterChangeKey = computed(() => {
    if (!props.filterState) return ''
    const f = props.filterState
    return [
      props.filter,
      props.searchQuery,
      JSON.stringify({
        use_case: f.use_case,
        persona: f.persona,
        setup_difficulty: f.setup_difficulty,
        license: f.license,
        language: f.language,
        hardware: f.hardware,
        deployment: f.deployment,
        model_format: f.model_format,
        maturity: f.maturity,
        features: f.features,
        category: f.category,
        commercial_use: f.commercial_use,
        offline_after_setup: f.offline_after_setup,
        telemetry: f.telemetry,
        last_updated: f.last_updated,
      }),
    ].join('::')
  })

  const fullSearchKey = computed(() => {
    return [filterChangeKey.value, activeSort.value, currentPage.value].join('::')
  })

  watch(fullSearchKey, async () => {
    await runOramaSearch()
  })

  watch(filterChangeKey, () => {
    currentPage.value = 1
  })

  watch(isOramaActive, (active) => {
    const el = document.getElementById('ssr-pagination')
    if (el) el.style.display = active ? 'none' : ''
  })

  return {
    hasNoFilterResults,
    hasNoSearchResults,
    toolCount,
    totalPages,
    activeSort,
    currentPage,
    filteredCards,
    promotedAds,
    sponsor,
    positions,
    isOramaActive,
    isSearchingInCategory,
    setSort,
    goToPage,
  }
}
