<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import FilterPanel from './FilterPanel.vue';
import type { FilterState } from '../types';

const props = defineProps<{
    state: FilterState;
    showModelFormat: boolean;
    activeCount: number;
    hideCategory?: boolean;
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
    if ((e.target as HTMLElement).classList.contains('z-40')) {
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
        <div class="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300" :class="isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'" @click="handleOverlayClick">
            <div class="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur-md border-t border-brand-forest/5 z-50 transition-transform duration-300 max-h-[85vh] flex flex-col rounded-t-4xl shadow-xl shadow-brand-forest/10" :class="isOpen ? 'translate-y-0' : 'translate-y-full'">
                <div class="flex items-center justify-between px-4 md:px-8 py-4 border-b border-brand-forest/5">
                    <span class="text-lg font-bold text-brand-forest tracking-tight">Filters</span>
                    <button class="flex items-center justify-center p-2 bg-transparent border border-transparent text-brand-muted hover:text-accent-teal transition-colors cursor-pointer" @click="close" aria-label="Close filters">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="overflow-y-auto px-4 md:px-8 py-4 flex-1 overscroll-contain">
                    <FilterPanel :state="state" :show-model-format="showModelFormat" :active-count="activeCount" :hide-category="hideCategory"
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
