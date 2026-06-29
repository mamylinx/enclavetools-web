<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FilterState } from '../types';
import { FILTER_GROUPS, LAST_UPDATED_OPTIONS } from '../composables/filterConfig';

const props = defineProps<{
    state: FilterState;
    showModelFormat: boolean;
    activeCount: number;
    hideCategory?: boolean;
}>();

const emit = defineEmits<{
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

const expandedGroups = ref<Record<string, boolean>>(
    Object.fromEntries(FILTER_GROUPS.map((g) => [g.key, true]))
);

function toggleGroup(key: string) {
    expandedGroups.value[key] = !expandedGroups.value[key];
}

function groupCount(key: keyof FilterState): number {
    const val = props.state[key];
    if (Array.isArray(val)) return val.length;
    if (key === 'last_updated') return val ? 1 : 0;
    return 0;
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
}

function handleToggle(key: keyof FilterState, value: string) {
    emit('toggle', key, value);
}

function handleClearGroup(key: keyof FilterState) {
    emit('clear', key);
}

function handleClearAll() {
    emit('clear-all');
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

const visibleGroups = computed(() => FILTER_GROUPS.filter(
    (g) => {
        if (props.hideCategory && g.key === 'category') return false;
        return g.key !== 'model_format' || props.showModelFormat;
    }
));
</script>

<template>
    <div class="w-full flex flex-col gap-2">
        <div class="flex justify-end pb-2 mb-2 border-b border-brand-forest/10">
            <button class="text-xs text-brand-muted hover:text-brand-forest transition-colors py-1 px-2 bg-transparent border border-transparent cursor-pointer" @click="handleClearAll">
                Reset
            </button>
        </div>
        <div v-for="group in visibleGroups" :key="group.key" class="border-b border-brand-forest/10 last:border-b-0">
            <button class="flex w-full items-center justify-between py-3 bg-transparent border border-transparent cursor-pointer text-left" @click="toggleGroup(group.key)"
                :aria-expanded="expandedGroups[group.key]">
                <span class="text-xs font-extrabold uppercase text-brand-forest tracking-widest flex items-center gap-2">
                    {{ group.label }}
                    <span v-if="groupCount(group.key as keyof FilterState) > 0" class="bg-brand-tealLight text-brand-teal px-2 py-1 border-2 border-brand-teal rounded-full font-bold text-[10px]">
                        {{ groupCount(group.key as keyof FilterState) }}
                    </span>
                </span>
                <svg class="text-brand-muted transition-transform duration-200" :class="{ 'rotate-180': expandedGroups[group.key] }"
                    xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            <div v-if="expandedGroups[group.key]" class="pb-4">
                <div class="flex flex-wrap gap-2">
                    <template v-if="group.type === 'single'">
                        <button v-for="opt in group.options" :key="String(opt.value)" class="px-3 py-2 text-xs font-bold transition-all duration-150 border rounded-full"
                            :class="isOptionSelected(group.key, opt.value) ? 'bg-brand-forest text-white border border-brand-forest/10 hover:bg-brand-teal hover:border-brand-teal' : 'text-brand-muted bg-white border border-brand-forest/10 hover:border-brand-forest hover:text-brand-forest'"
                            @click="handleSingleSelect(group.key, opt.value)">
                            {{ optionLabel(group.key, opt.value) }}
                        </button>
                    </template>

                    <template v-else>
                        <button v-for="opt in group.options" :key="String(opt.value)" class="px-3 py-2 text-xs font-bold transition-all duration-150 border rounded-full"
                            :class="isOptionSelected(group.key, opt.value) ? 'bg-brand-forest text-white border border-brand-forest/10 hover:bg-brand-teal hover:border-brand-teal' : 'text-brand-muted bg-white border border-brand-forest/10 hover:border-brand-forest hover:text-brand-forest'"
                            @click="handleToggle(group.key, opt.value || '')">
                            {{ opt.label }}
                        </button>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

