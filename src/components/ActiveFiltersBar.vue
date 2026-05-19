<script setup lang="ts">
import { computed } from 'vue';
import type { FilterState } from '../types';
import { /** CATEGORY_OPTIONS, **/ LICENSE_OPTIONS, LANGUAGE_OPTIONS, HARDWARE_OPTIONS, DEPLOYMENT_OPTIONS, MODEL_FORMAT_OPTIONS, MATURITY_OPTIONS, LAST_UPDATED_OPTIONS } from '../composables/filterConfig';

const props = defineProps<{
    state: FilterState;
    activeCount: number;
}>();

const emit = defineEmits<{
    remove: [key: keyof FilterState, value: string];
    'clear-all': [];
}>();

function getGroupLabel(group: keyof FilterState): string {
    const labels: Record<keyof FilterState, string> = {
        // category: 'Category',
        license: 'License',
        language: 'Language',
        hardware: 'Hardware',
        deployment: 'Deployment',
        model_format: 'Model Format',
        maturity: 'Maturity',
        last_updated: 'Last Updated',
    };
    return labels[group];
}

function getLabel(group: keyof FilterState, value: string): string {
    const maps: Record<string, Array<{ value: string | null; label: string }>> = {
        // category: CATEGORY_OPTIONS,
        license: LICENSE_OPTIONS,
        language: LANGUAGE_OPTIONS,
        hardware: HARDWARE_OPTIONS,
        deployment: DEPLOYMENT_OPTIONS,
        model_format: MODEL_FORMAT_OPTIONS,
        maturity: MATURITY_OPTIONS,
        last_updated: LAST_UPDATED_OPTIONS,
    };
    const opts = maps[group] || [];
    const found = opts.find((o) => o.value === value);
    return found?.label || value;
}

const chips = computed(() => {
    const result: Array<{ group: keyof FilterState; value: string; label: string }> = [];

    if (props.state.sort !== 'featured') {
        result.push({ group: 'sort', value: props.state.sort, label: getLabel('sort', props.state.sort) });
    }
    // props.state.category.forEach((v) => result.push({ group: 'category', value: v, label: getLabel('category', v) }));
    props.state.license.forEach((v) => result.push({ group: 'license', value: v, label: getLabel('license', v) }));
    props.state.language.forEach((v) => result.push({ group: 'language', value: v, label: getLabel('language', v) }));
    props.state.hardware.forEach((v) => result.push({ group: 'hardware', value: v, label: getLabel('hardware', v) }));
    props.state.deployment.forEach((v) => result.push({ group: 'deployment', value: v, label: getLabel('deployment', v) }));
    props.state.model_format.forEach((v) => result.push({ group: 'model_format', value: v, label: getLabel('model_format', v) }));
    props.state.maturity.forEach((v) => result.push({ group: 'maturity', value: v, label: getLabel('maturity', v) }));
    if (props.state.last_updated) {
        result.push({ group: 'last_updated', value: props.state.last_updated, label: getLabel('last_updated', props.state.last_updated) });
    }

    return result;
});
</script>

<template>
    <div v-if="chips.length > 0" class="active-filters-bar">
        <div
            v-for="(chip, i) in chips"
            :key="`${chip.group}-${chip.value}-${i}`"
            class="filter-chip"
        >
            <span class="filter-chip-group">{{ getGroupLabel(chip.group) }}:</span>
            <span class="filter-chip-value">{{ chip.label }}</span>
            <button class="filter-chip-remove" @click="emit('remove', chip.group, chip.value)" aria-label="Remove filter">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
        <button class="clear-all-btn" @click="emit('clear-all')">Clear all</button>
    </div>
</template>
