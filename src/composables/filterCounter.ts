import { computed } from 'vue';
import type { FilterState } from '../interfaces/tool';

export function useActiveFilterCount(state: FilterState) {
  return computed(() => {
    let count = 0;
    if (state.sort !== 'featured') count++;
    count += state.category.length;
    count += state.use_case.length;
    count += state.persona.length;
    count += state.setup_difficulty.length;
    count += state.license.length;
    count += state.language.length;
    count += state.hardware.length;
    count += state.deployment.length;
    count += state.model_format.length;
    count += state.maturity.length;
    count += state.features.length;
    if (state.commercial_use) count++;
    if (state.offline_after_setup) count++;
    if (state.telemetry) count++;
    if (state.last_updated) count++;
    return count;
  });
}
