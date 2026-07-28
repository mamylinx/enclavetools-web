import { computed } from 'vue';
import type { FilterState } from '../types';
import { countActiveFilters } from './filterDefinitions';

/** Returns a computed ref counting how many filters are actively set. */
export function useActiveFilterCount(state: FilterState) {
  return computed(() => countActiveFilters(state));
}
