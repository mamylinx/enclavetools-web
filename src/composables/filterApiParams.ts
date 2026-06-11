import type { FilterState } from '../interfaces/tool';

export function toApiParams(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.sort !== 'featured') params.set('sort', state.sort);
  state.category.forEach((v) => params.append('cat', v));
  state.use_case.forEach((v) => params.append('use', v));
  state.persona.forEach((v) => params.append('persona', v));
  state.setup_difficulty.forEach((v) => params.append('setup', v));
  state.license.forEach((v) => params.append('license', v));
  state.language.forEach((v) => params.append('lang', v));
  state.hardware.forEach((v) => params.append('hw', v));
  state.deployment.forEach((v) => params.append('deploy', v));
  state.model_format.forEach((v) => params.append('format', v));
  state.maturity.forEach((v) => params.append('mat', v));
  state.features.forEach((v) => params.append('feature', v));
  if (state.commercial_use) params.set('commercial', state.commercial_use);
  if (state.offline_after_setup) params.set('offline', state.offline_after_setup);
  if (state.telemetry) params.set('telemetry', state.telemetry);
  if (state.last_updated) params.set('updated', state.last_updated);
  return params;
}
