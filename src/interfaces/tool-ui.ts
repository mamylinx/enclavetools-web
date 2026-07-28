/** All possible values for a filter field's options. */
export interface FilterOptionValue {
  value: string | null;
  label: string;
}

/** Describes one filter group in the UI (key, displayed label, type, and available options). */
export interface FilterGroupConfig {
  key: keyof FilterState;
  label: string;
  type: 'single' | 'multi';
  options: FilterOptionValue[];
  conditional?: {
    group: keyof FilterState;
    values: string[];
  };
}

/** Current state of all active filters — serialized from/to URL params and localStorage. */
export interface FilterState {
  sort: string;
  category: string[];
  use_case: string[];
  persona: string[];
  setup_difficulty: string[];
  license: string[];
  language: string[];
  hardware: string[];
  deployment: string[];
  model_format: string[];
  maturity: string[];
  features: string[];
  commercial_use: string | null;
  offline_after_setup: string | null;
  telemetry: string | null;
  last_updated: string | null;
}
