<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { FilterState } from '../types';
import { FILTER_GROUPS, LAST_UPDATED_OPTIONS } from '../composables/filterConfig';

const props = defineProps<{
  state: FilterState;
  showModelFormat: boolean;
  activeCount: number;
  hideCategory?: boolean;
}>();

const emit = defineEmits<{
  'update:sort': [value: string];
  'update:category': [value: string[]];
  'update:use_case': [value: string[]];
  'update:persona': [value: string[]];
  'update:setup_difficulty': [value: string[]];
  'update:license': [value: string[]];
  'update:language': [value: string[]];
  'update:hardware': [value: string[]];
  'update:deployment': [value: string[]];
  'update:model_format': [value: string[]];
  'update:maturity': [value: string[]];
  'update:features': [value: string[]];
  'update:commercial_use': [value: string | null];
  'update:offline_after_setup': [value: string | null];
  'update:telemetry': [value: string | null];
  'update:last_updated': [value: string | null];
  toggle: [key: keyof FilterState, value: string];
  clear: [key: keyof FilterState];
  'clear-all': [];
}>();

const openDropdown = ref<string | null>(null);
const dropdownEl = ref<HTMLElement | null>(null);

const visibleGroups = computed(() => FILTER_GROUPS.filter(
  (g) => {
    if (props.hideCategory && g.key === 'category') return false;
    return g.key !== 'model_format' || props.showModelFormat;
  }
));

function toggleDropdown(key: string) {
  openDropdown.value = openDropdown.value === key ? null : key;
}

function columnCount(group: { options: { value: string | null; label: string }[] }): number {
  const len = group.options.length;
  if (len <= 6) return 1;
  if (len <= 12) return 2;
  if (len <= 18) return 3;
  return 4;
}

function closeDropdown() {
  openDropdown.value = null;
}

function handleSingleSelect(key: keyof FilterState, value: string | null) {
  const normalized = value || null;
  if (key === 'last_updated') {
    emit('update:last_updated', normalized);
  } else if (key === 'commercial_use') {
    emit('update:commercial_use', normalized);
  } else if (key === 'offline_after_setup') {
    emit('update:offline_after_setup', normalized);
  } else if (key === 'telemetry') {
    emit('update:telemetry', normalized);
  }
  closeDropdown();
}

function handleToggle(key: keyof FilterState, value: string) {
  emit('toggle', key, value);
}

function isOptionSelected(key: keyof FilterState, value: string | null): boolean {
  const stateVal = props.state[key];
  if (Array.isArray(stateVal)) return typeof value === 'string' && stateVal.includes(value);
  if (key === 'last_updated' || key === 'commercial_use' || key === 'offline_after_setup' || key === 'telemetry') {
    return (stateVal || null) === (value || null);
  }
  return false;
}

function optionLabel(key: keyof FilterState, value: string | null): string {
  if (key === 'last_updated') {
    const opt = LAST_UPDATED_OPTIONS.find((o) => o.value === value);
    return opt?.label || value || 'Any time';
  }
  return value || 'Any';
}

function groupCount(key: keyof FilterState): number {
  const val = props.state[key];
  if (Array.isArray(val)) return val.length;
  if (key === 'last_updated') return val ? 1 : 0;
  return 0;
}

function activeLabel(key: string): string {
  const count = groupCount(key as keyof FilterState);
  if (count === 0) return '';
  return ` (${count})`;
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick);
});

function handleGlobalClick(e: MouseEvent) {
  if (dropdownEl.value && !dropdownEl.value.contains(e.target as Node)) {
    closeDropdown();
  }
}
</script>

<template>
  <div ref="dropdownEl" class="w-full">
    <div class="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-wrap items-center gap-2 bg-linear-to-r from-brand-tealLight/25 via-brand-bg to-accent-yellow/5">
      <div v-for="group in visibleGroups" :key="group.key" class="relative">
        <button
          class="h-10 px-4 text-xs font-bold uppercase tracking-wider border transition-colors duration-150 flex items-center gap-2 whitespace-nowrap rounded-full"
          :class="groupCount(group.key as keyof FilterState) > 0
            ? 'bg-gradient-cool text-white border-transparent shadow-sm shadow-accent-green/20'
            : 'bg-white/90 backdrop-blur-sm text-brand-forest border-brand-forest/5 hover:border-accent-teal/30 hover:text-accent-teal hover:shadow-sm'"
          @click.stop="toggleDropdown(group.key)"
          :aria-expanded="openDropdown === group.key"
        >
          {{ group.label }}
          <svg
            class="transition-transform duration-200"
            :class="{ 'rotate-180': openDropdown === group.key }"
            xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div
          v-if="openDropdown === group.key"
          class="absolute top-full left-0 mt-2 z-50 border border-brand-forest/5 bg-white/98 backdrop-blur-md shadow-lg shadow-brand-forest/10 rounded-2xl"
        >
          <div
            class="max-h-72 p-2 gap-1 overflow-x-hidden overflow-y-auto"
            :class="columnCount(group) === 1 ? 'columns-1' : columnCount(group) === 2 ? 'columns-2' : columnCount(group) === 3 ? 'columns-3' : 'columns-4'"
          >
            <template v-if="group.type === 'single'">
              <button
                v-for="opt in group.options"
                :key="String(opt.value)"
                class="block w-full text-left px-3 py-2 text-xs font-bold transition-all duration-150 border whitespace-nowrap break-inside-avoid mb-1 rounded-lg"
                :class="isOptionSelected(group.key, opt.value)
                  ? 'bg-accent-teal/10 text-accent-teal border-accent-teal/20 font-bold'
                  : 'text-brand-muted bg-transparent border-transparent hover:bg-accent-teal/5 hover:text-accent-teal'"
                @click="handleSingleSelect(group.key, opt.value)"
              >
                {{ optionLabel(group.key, opt.value) }}
              </button>
            </template>
            <template v-else>
              <button
                v-for="opt in group.options"
                :key="String(opt.value)"
                class="block w-full text-left px-3 py-2 text-xs font-bold transition-all duration-150 border whitespace-nowrap break-inside-avoid mb-1 rounded-lg"
                :class="isOptionSelected(group.key, opt.value)
                  ? 'bg-accent-teal/10 text-accent-teal border-accent-teal/20 font-bold'
                  : 'text-brand-muted bg-transparent border-transparent hover:bg-accent-teal/5 hover:text-accent-teal'"
                @click="handleToggle(group.key, opt.value || '')"
              >
                {{ opt.label }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <div class="flex-1"></div>

      <button
        v-if="activeCount > 0"
        class="h-10 px-4 text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-brand-muted border border-brand-forest/5 hover:border-accent-red/30 hover:text-accent-red hover:bg-accent-red/5 transition-all duration-150 rounded-full"
        @click="emit('clear-all')"
      >
        Clear all ({{ activeCount }})
      </button>
    </div>
  </div>
</template>
