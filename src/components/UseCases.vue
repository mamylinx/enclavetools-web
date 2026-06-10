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
        class="max-w-[1400px] mx-auto px-4 md:px-8 py-12 scroll-mt-20 bg-gray-50"
        aria-labelledby="use-cases-heading"
    >
        <div>
            <p class="text-xs font-black uppercase tracking-widest text-gray-900 mb-2">
                {{ eyebrow || "Use cases" }}
            </p>
            <h2
                id="use-cases-heading"
                class="max-w-[640px] text-3xl md:text-4xl lg:text-5xl text-gray-900 leading-[0.98] font-black tracking-tight mb-6"
            >
                {{ heading || "Start from the risk you need to control." }}
            </h2>
        </div>

        <div>
            <div
                v-for="(p, index) in persona"
                :key="index"
                class="border-2 border-gray-900 p-6 bg-white"
                :class="{ 'mt-8': index > 0 }"
            >
                <div class="flex flex-col md:flex-row md:items-start gap-4 mb-6">
                    <div class="flex items-start gap-4 flex-1 min-w-0 w-full md:w-auto">
                        <span
                            class="text-sm font-black shrink-0 bg-gray-900 text-white w-8 h-8 flex items-center justify-center"
                        >
                            {{ String(index + 1).padStart(2, "0") }}
                        </span>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 md:gap-3 flex-wrap">
                                <h3 class="text-lg md:text-xl font-black text-gray-900">
                                    {{ p }}
                                </h3>
                                <span
                                    class="inline-flex items-center px-2 py-1 text-xs font-black uppercase border-2 border-gray-900 bg-gray-900 text-white"
                                >
                                    {{ featuredCounts[index] }}
                                    {{ featuredCounts[index] === 1 ? "tool" : "tools" }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <a
                        :href="'/all?persona=' + encodeURIComponent(p)"
                        class="shrink-0 inline-flex items-center justify-center h-10 border-2 border-gray-900 px-4 text-xs font-black uppercase tracking-wider bg-white text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-all duration-300 ease-out-expo hover:-translate-y-1 no-underline w-full md:w-auto"
                    >
                        <span class="hidden md:inline">Browse tools for {{ p }}</span>
                        <span class="md:hidden">Browse</span>
                        <span aria-hidden="true" class="text-lg leading-none ml-1">↗</span>
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
                        class="border-2 border-gray-200 p-6 bg-white no-underline block group transition-all duration-300 ease-out-expo hover:border-gray-900 hover:-translate-y-1 hover:shadow-card-hover"
                    >
                        <strong class="block text-sm font-black text-gray-900 group-hover:text-primary-500 transition-colors">
                            {{ tool.title }}
                        </strong>
                        <span class="text-xs text-gray-500 mt-1 line-clamp-2">
                            {{ tool.body }}
                        </span>
                    </a>
                </div>
            </div>
        </div>
    </section>
</template>
