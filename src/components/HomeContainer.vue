<script setup lang="ts">
import { computed } from 'vue';
import Card from './Card.vue';
import type { ToolWithCategory } from '../utils/toolModel';
import siteContent from '../data/site-content.json';

const c = siteContent as Record<string, string>;

const props = defineProps<{
    ssrTools?: ToolWithCategory[];
}>();

const featuredTools = computed(() => {
    if (!props.ssrTools) return [];
    // Filter featured tools
    const featured = props.ssrTools.filter(tool => tool.featured);
    // Shuffle and pick 3
    const shuffled = [...featured].sort(() => 0.5 - Math.random());
    // If not enough featured, fallback to randomly picked tools
    if (shuffled.length < 3) {
        const others = props.ssrTools.filter(tool => !tool.featured).sort(() => 0.5 - Math.random());
        shuffled.push(...others.slice(0, 3 - shuffled.length));
    }
    return shuffled.slice(0, 3);
});

const latestTools = computed(() => {
    if (!props.ssrTools) return [];
    // Sort by date-added (not last_updated) according to requirements: "latest added tools"
    return [...props.ssrTools].sort((a, b) => {
        const dateA = new Date(a['date-added'] || 0).getTime();
        const dateB = new Date(b['date-added'] || 0).getTime();
        return dateB - dateA;
    }).slice(0, 6);
});
</script>

<template>
    <div class="flex flex-col gap-10">
        <section>
            <h3 class="text-2xl font-black text-gray-900 mb-6">{{ c.section_featured_tools || 'Featured Tools' }}</h3>
            <ul data-cards-grid role="list" class="grid grid-cols-1 gap-4 m-0 p-0">
                <Card v-for="(item, i) in featuredTools" :key="`featured-${i}`"
                    :href="item.url" :title="item.title" :body="item.body" :license="item.license"
                    :date-added="item['date-added']" :slug="item.slug" :featured="item.featured"
                    :github-stars="item.popularity_score" :last-updated="item.last_updated"
                    :setup-difficulty="item.setup_difficulty" :features="item.features"
                    :hardware="item.hardware" :commercial-use="item.commercial_use"
                    :category="Array.isArray(item.category) ? item.category[0] : item.category" />
            </ul>
        </section>

        <section>
            <div class="flex flex-row items-center justify-between mb-6">
                <h3 class="text-2xl font-black text-gray-900 m-0">{{ c.section_latest_added || 'Latest Added' }}</h3>
                <a href="/all" class="text-sm font-bold bg-white border-2 border-gray-900 text-gray-900 px-4 py-2 hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors no-underline">{{ c.section_browse_all || 'Browse all' }}</a>
            </div>
            <ul data-cards-grid role="list" class="grid grid-cols-1 gap-4 m-0 p-0">
                <Card v-for="(item, i) in latestTools" :key="`latest-${i}`"
                    :href="item.url" :title="item.title" :body="item.body" :license="item.license"
                    :date-added="item['date-added']" :slug="item.slug" :featured="item.featured"
                    :github-stars="item.popularity_score" :last-updated="item.last_updated"
                    :setup-difficulty="item.setup_difficulty" :features="item.features"
                    :hardware="item.hardware" :commercial-use="item.commercial_use"
                    :category="Array.isArray(item.category) ? item.category[0] : item.category" />
            </ul>
        </section>
    </div>
</template>
