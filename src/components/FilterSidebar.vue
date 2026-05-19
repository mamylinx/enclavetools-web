<script setup lang="ts">
import FilterPanel from './FilterPanel.vue';
import type { FilterState } from '../types';

defineProps<{
    state: FilterState;
    showModelFormat: boolean;
    activeCount: number;
}>();

const emit = defineEmits<{
    'update:sort': [value: string];
    'update:category': [value: string[]];
    'update:license': [value: string[]];
    'update:language': [value: string[]];
    'update:hardware': [value: string[]];
    'update:deployment': [value: string[]];
    'update:model_format': [value: string[]];
    'update:maturity': [value: string[]];
    'update:last_updated': [value: string | null];
    toggle: [key: keyof FilterState, value: string];
    clear: [key: keyof FilterState];
    'clear-all': [];
}>();
</script>

<template>
    <aside class="filter-sidebar">
        <FilterPanel
            :state="state"
            :show-model-format="showModelFormat"
            :active-count="activeCount"
            @update:sort="(v) => emit('update:sort', v)"
            @update:category="(v) => emit('update:category', v)"
            @update:license="(v) => emit('update:license', v)"
            @update:language="(v) => emit('update:language', v)"
            @update:hardware="(v) => emit('update:hardware', v)"
            @update:deployment="(v) => emit('update:deployment', v)"
            @update:model_format="(v) => emit('update:model_format', v)"
            @update:maturity="(v) => emit('update:maturity', v)"
            @update:last_updated="(v) => emit('update:last_updated', v)"
            @toggle="(k, v) => emit('toggle', k, v)"
            @clear="(k) => emit('clear', k)"
            @clear-all="emit('clear-all')"
        />
    </aside>
</template>
