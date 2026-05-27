<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import FilterPanel from './FilterPanel.vue';
import type { FilterState } from '../types';

const props = defineProps<{
    state: FilterState;
    showModelFormat: boolean;
    activeCount: number;
}>();

const emit = defineEmits<{
    close: [];
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

const isOpen = ref(false);

function open() {
    isOpen.value = true;
    document.body.style.overflow = 'hidden';
}

function close() {
    isOpen.value = false;
    document.body.style.overflow = '';
    emit('close');
}

function handleOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('bottom-sheet-overlay')) {
        close();
    }
}

onMounted(() => {
    open();
});

onUnmounted(() => {
    document.body.style.overflow = '';
});
</script>

<template>
    <Teleport to="body">
        <div class="bottom-sheet-overlay" :class="{ show: isOpen }" @click="handleOverlayClick">
            <div class="bottom-sheet-wrapper" :class="{ show: isOpen }">
                <div class="bottom-sheet-header">
                    <span class="bottom-sheet-title">Filters</span>
                    <button class="bottom-sheet-close" @click="close" aria-label="Close filters">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="bottom-sheet-content">
                    <FilterPanel :state="state" :show-model-format="showModelFormat" :active-count="activeCount"
                        @update:sort="(v) => emit('update:sort', v)"
                        @update:category="(v) => emit('update:category', v)"
                        @update:use_case="(v) => emit('update:use_case', v)"
                        @update:persona="(v) => emit('update:persona', v)"
                        @update:setup_difficulty="(v) => emit('update:setup_difficulty', v)"
                        @update:license="(v) => emit('update:license', v)"
                        @update:language="(v) => emit('update:language', v)"
                        @update:hardware="(v) => emit('update:hardware', v)"
                        @update:deployment="(v) => emit('update:deployment', v)"
                        @update:model_format="(v) => emit('update:model_format', v)"
                        @update:maturity="(v) => emit('update:maturity', v)"
                        @update:features="(v) => emit('update:features', v)"
                        @update:commercial_use="(v) => emit('update:commercial_use', v)"
                        @update:offline_after_setup="(v) => emit('update:offline_after_setup', v)"
                        @update:telemetry="(v) => emit('update:telemetry', v)"
                        @update:last_updated="(v) => emit('update:last_updated', v)"
                        @toggle="(k, v) => emit('toggle', k, v)" @clear="(k) => emit('clear', k)"
                        @clear-all="emit('clear-all')" />
                </div>
            </div>
        </div>
    </Teleport>
</template>
