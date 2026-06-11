import type { FilterState } from '../interfaces/tool';

export function getActiveFiltersForDisplay(
  state: FilterState,
): Array<{ group: string; label: string; value: string }> {
  const result: Array<{ group: string; label: string; value: string }> = [];

  if (state.sort !== 'featured') {
    result.push({ group: 'Sort', label: 'Sort', value: state.sort });
  }
  state.category.forEach((v) => result.push({ group: 'Category', label: 'Category', value: v }));
  state.use_case.forEach((v) => result.push({ group: 'Use Case', label: 'Use Case', value: v }));
  state.persona.forEach((v) => result.push({ group: 'Persona', label: 'Persona', value: v }));
  state.setup_difficulty.forEach((v) => result.push({ group: 'Setup', label: 'Setup', value: v }));
  state.license.forEach((v) => result.push({ group: 'License', label: 'License', value: v }));
  state.language.forEach((v) => result.push({ group: 'Language', label: 'Language', value: v }));
  state.hardware.forEach((v) => result.push({ group: 'Hardware', label: 'Hardware', value: v }));
  state.deployment.forEach((v) => result.push({ group: 'Deployment', label: 'Deployment', value: v }));
  state.model_format.forEach((v) => result.push({ group: 'Model Format', label: 'Model Format', value: v }));
  state.maturity.forEach((v) => result.push({ group: 'Maturity', label: 'Maturity', value: v }));
  state.features.forEach((v) => result.push({ group: 'Feature', label: 'Feature', value: v }));
  if (state.commercial_use) result.push({ group: 'Commercial Use', label: 'Commercial Use', value: state.commercial_use });
  if (state.offline_after_setup) result.push({ group: 'Offline', label: 'Offline', value: state.offline_after_setup });
  if (state.telemetry) result.push({ group: 'Telemetry', label: 'Telemetry', value: state.telemetry });
  if (state.last_updated) {
    result.push({ group: 'Last Updated', label: 'Last Updated', value: state.last_updated });
  }

  return result;
}
