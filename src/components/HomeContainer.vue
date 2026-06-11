<script setup lang="ts">
import { computed } from 'vue';
import Card from './Card.vue';
import type { ToolWithCategory } from '../utils/toolModel';
import siteContent from '../data/site-content.json';
import marketingData from '../data/marketing.json';
import type { MarketingConfig } from '../interfaces/content';

const c = siteContent as Record<string, string>;
const m = marketingData as MarketingConfig;
const sponsors = computed(() => m.sponsors || []);
const featured = m.featured?.[0] || null;

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
    }).slice(0, 8);
});
</script>

<template>
    <div class="flex flex-col gap-8">
        <section>
            <h3 class="text-2xl font-black text-gray-900 mb-4">{{ c.section_featured_tools || 'Featured Tools' }}</h3>
            <ul data-cards-grid role="list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 m-0 p-0">
                <li v-if="featured"
                    class="col-span-1 border-2 border-gray-200 p-6 bg-white transition-all duration-300 ease-out-expo hover:border-gray-900 hover:-translate-y-1 hover:shadow-card-hover list-none flex flex-col h-full">
                    <div class="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">{{ c.featured_label || 'Featured' }}</div>
                    <div class="text-lg font-black text-gray-900 mb-2">{{ featured.title }}</div>
                    <p class="text-sm font-medium text-gray-600 mb-4 flex-1">{{ featured.description }}</p>
                    <a :href="featured.url || '/submit'"
                        class="block w-full h-10 bg-gray-900 text-white font-bold hover:bg-primary-500 transition-colors text-center no-underline border-none inline-flex items-center justify-center">{{ featured.cta }}</a>
                </li>
                <Card v-for="(item, i) in featuredTools" :key="`featured-${i}`" :href="item.url" :title="item.title"
                    :body="item.body" :license="item.license" :date-added="item['date-added']" :slug="item.slug"
                    :featured="item.featured" :github-stars="item.popularity_score" :last-updated="item.last_updated"
                    :setup-difficulty="item.setup_difficulty" :features="item.features" :hardware="item.hardware"
                    :commercial-use="item.commercial_use"
                    :category="Array.isArray(item.category) ? item.category[0] : item.category" />
            </ul>
        </section>

        <section v-if="sponsors.length > 0">
            <h3 class="text-2xl font-black text-gray-900 mb-4">{{ c.marketing_sponsor_label || 'Sponsor' }}</h3>
            <div class="grid gap-4"
                :class="sponsors.length === 1 ? 'grid-cols-1' : sponsors.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'">
                <a v-for="sponsor in sponsors" :key="sponsor.title || sponsor.cta"
                    :href="sponsor.url || '#'"
                    class="flex flex-col border-2 border-gray-200 p-6 bg-white transition-all duration-300 ease-out-expo hover:border-gray-900 hover:-translate-y-1 hover:shadow-card-hover no-underline">
                    <div class="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">{{ c.marketing_sponsor_label || 'Sponsor' }}</div>
                    <div v-if="sponsor.title" class="text-xl font-black text-gray-900 mb-2">{{ sponsor.title }}</div>
                    <p class="text-sm font-medium text-gray-600 flex-1">{{ sponsor.description }}</p>
                </a>
            </div>
            <div class="flex justify-center mt-6">
                <a href="/submit"
                    class="text-sm font-bold bg-white border-2 border-gray-900 text-gray-900 h-10 px-4 inline-flex items-center hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors no-underline">
                    Sponsor the directory →
                </a>
            </div>
        </section>

        <section>
            <div class="flex flex-row items-center justify-between mb-6">
                <h3 class="text-2xl font-black text-gray-900 m-0">{{ c.section_latest_added || 'Latest Added' }}</h3>
                <a href="/all" class="text-sm font-bold bg-white border-2 border-gray-900 text-gray-900 h-10 px-4 inline-flex items-center hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors no-underline">{{ c.section_browse_all || 'Browse all' }}</a>
            </div>
            <ul data-cards-grid role="list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 m-0 p-0">
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
