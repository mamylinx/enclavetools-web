<script setup lang="ts">
interface FeaturedTool {
    slug: string;
    title: string;
    body: string;
}

const props = defineProps<{
    featuredTools: FeaturedTool[][];
    featuredCounts: number[];
    persona: string[];
    eyebrow?: string;
    heading?: string;
}>();
</script>

<template>
    <section
        id="use-cases"
        class="max-w-[1400px] mx-auto px-4 md:px-8 py-12 scroll-mt-20"
        aria-labelledby="use-cases-heading"
    >
        <div>
            <p class="text-xs font-extrabold uppercase tracking-widest text-accent-teal mb-2">
                {{ eyebrow || "Use cases" }}
            </p>
            <h2
                id="use-cases-heading"
                class="max-w-[640px] text-3xl md:text-4xl lg:text-5xl text-brand-forest font-extrabold tracking-tight mb-6"
            >
                {{ heading || "Start from the risk you need to control." }}
            </h2>
        </div>

        <div>
            <div
                v-for="(p, index) in persona"
                :key="index"
                class="border border-brand-forest/5 p-6 bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm shadow-brand-forest/5"
                :class="{ 'mt-8': index > 0 }"
            >
                <div class="flex flex-col md:flex-row md:items-start gap-4 mb-6">
                    <div class="flex items-start gap-4 flex-1 min-w-0 w-full md:w-auto">
                        <span
                            class="text-sm font-extrabold shrink-0 bg-gradient-cool text-white w-8 h-8 flex items-center justify-center rounded-full shadow-sm shadow-accent-green/20"
                        >
                            {{ String(index + 1).padStart(2, "0") }}
                        </span>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 md:gap-3 flex-wrap">
                                <h3 class="text-lg md:text-xl font-extrabold text-brand-forest">
                                    {{ p }}
                                </h3>
                                <span
                                    class="inline-flex items-center px-2.5 py-1 text-xs font-extrabold uppercase border border-accent-teal/20 bg-accent-teal/10 text-accent-teal rounded-full"
                                >
                                    {{ featuredCounts[index] }}
                                    {{ featuredCounts[index] === 1 ? "tool" : "tools" }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <a
                        :href="'/all?persona=' + encodeURIComponent(p)"
                        class="shrink-0 inline-flex items-center justify-center h-10 border border-brand-forest/5 px-5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/90 text-brand-forest hover:bg-accent-teal hover:text-white hover:border-accent-teal hover:shadow-md transition-all duration-300 ease-out-expo hover:-translate-y-1 no-underline w-full md:w-auto"
                    >
                        <span class="hidden md:inline">Browse tools for {{ p }}</span>
                        <span class="md:hidden">Browse</span>
                        <svg class="w-4 h-4 ml-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </a>
                </div>

                <div
                    v-if="featuredTools[index]?.length"
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    <a
                        v-for="tool in featuredTools[index].slice(0, 4)"
                        :key="tool.slug"
                        :href="`/tools/${tool.slug}`"
                        class="border border-brand-forest/5 p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm shadow-brand-forest/5 no-underline block group transition-all duration-300 ease-out-expo hover:border-accent-teal/20 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,54,27,0.08)]"
                    >
                        <strong class="block text-sm font-extrabold text-brand-forest group-hover:text-accent-teal transition-colors">
                            {{ tool.title }}
                        </strong>
                        <span class="text-xs text-brand-muted mt-1 line-clamp-2">
                            {{ tool.body }}
                        </span>
                    </a>
                </div>
            </div>
        </div>
    </section>
</template>
