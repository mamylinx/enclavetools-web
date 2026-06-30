<script setup lang="ts">
import { h, computed, type Component } from 'vue';

const props = defineProps<{
    icon?: Component | string;
    message?: string;
    actionText?: string;
    actionHref?: string;
}>();

const emit = defineEmits<{
    action: [];
}>();

const iconComponent = computed(() => {
    if (!props.icon) return null;
    if (typeof props.icon === 'string') {
        return iconMap[props.icon] || null;
    }
    return props.icon;
});

const iconMap: Record<string, Component> = {
    search: {
        render() {
            return h('svg', {
                xmlns: 'http://www.w3.org/2000/svg',
                width: 48,
                height: 48,
                viewBox: '0 0 48 48',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
            }, [
                h('circle', { cx: 20, cy: 20, r: 14 }),
                h('path', { d: 'M30 30l12 12' }),
            ]);
        },
    },
    filter: {
        render() {
            return h('svg', {
                xmlns: 'http://www.w3.org/2000/svg',
                width: 48,
                height: 48,
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
            }, [
                h('path', { d: 'M4 6h16M4 12h10M4 18h4' }),
            ]);
        },
    },
    bookmark: {
        render() {
            return h('svg', {
                xmlns: 'http://www.w3.org/2000/svg',
                width: 48,
                height: 48,
                viewBox: '0 0 48 48',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
            }, [
                h('path', { d: 'm37 47-13.5-5L11 47V1h26v46z', clipRule: 'evenodd' }),
            ]);
        },
    },
};
</script>

<template>
    <div class="flex flex-col items-center justify-center py-16 text-center px-4 bg-brand-bg/50 border border-dashed border-brand-forest/20">
        <div v-if="iconComponent" class="text-brand-forest/20 mb-6 w-16 h-16">
            <component :is="iconComponent" />
        </div>
        <p v-if="props.message" class="text-lg font-bold text-brand-muted mb-6 max-w-[400px]">{{ props.message }}</p>
        <a v-if="props.actionText && props.actionHref" :href="props.actionHref" class="inline-flex px-4 h-12 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider no-underline hover:bg-black transition-colors border-none cursor-pointer rounded-full items-center justify-center shadow-sm">
            {{ props.actionText }}
        </a>
        <button v-else-if="props.actionText" class="inline-flex px-4 h-12 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider no-underline hover:bg-black transition-colors border-none cursor-pointer rounded-full items-center justify-center shadow-sm" @click="emit('action')">
            {{ props.actionText }}
        </button>
    </div>
</template>
