<script setup lang="ts">
import { h, computed } from 'vue';

const props = defineProps<{
    icon?: any;
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

const iconMap: Record<string, any> = {
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
    <div class="empty-state">
        <div v-if="iconComponent" class="empty-state-icon">
            <component :is="iconComponent" />
        </div>
        <p v-if="props.message" class="empty-state-message">{{ props.message }}</p>
        <a v-if="props.actionText && props.actionHref" :href="props.actionHref" class="empty-state-action">
            {{ props.actionText }}
        </a>
        <button v-else-if="props.actionText" class="empty-state-action" @click="emit('action')">
            {{ props.actionText }}
        </button>
    </div>
</template>
