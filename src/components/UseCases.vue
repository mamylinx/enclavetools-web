<script setup lang="ts">
import { ref } from 'vue';

interface Section {
    name: string;
    copy: string;
    categories: string[];
}

interface FeaturedTool {
    slug: string;
    title: string;
    body: string;
}

const props = defineProps<{
    sections: Section[];
    featuredTools: FeaturedTool[][];
    eyebrow?: string;
    heading?: string;
}>();

const activeTab = ref(0);

function selectTab(index: number) {
    activeTab.value = index;
}
</script>

<template>
    <section
        id="use-cases"
        class="max-w-[1400px] mx-auto px-4 md:px-8 py-12 scroll-mt-[82px]"
        aria-labelledby="use-cases-heading"
    >
        <div class="mb-8">
            <p class="text-xs font-extrabold uppercase tracking-widest text-gray-900">
                {{ eyebrow || "Use cases" }}
            </p>
            <h2
                id="use-cases-heading"
                class="max-w-[620px] text-3xl md:text-4xl lg:text-5xl text-gray-900 leading-[0.98] font-black tracking-tight mt-3"
            >
                {{ heading || "Start from the risk you need to control." }}
            </h2>
        </div>

        <div class="flex flex-col md:flex-row gap-6">
            <div
                class="flex md:flex-col border-2 border-gray-900 md:w-56 lg:w-64 shrink-0 md:self-start"
                role="tablist"
                aria-label="Use cases"
            >
                <button
                    v-for="(section, index) in sections"
                    :key="index"
                    role="tab"
                    :id="`use-case-tab-${index}`"
                    :aria-controls="`use-case-panel-${index}`"
                    :aria-selected="activeTab === index"
                    class="flex items-center gap-3 px-4 h-12 text-left border-b-2 md:border-b-0 md:border-r-2 border-gray-900 last:border-b-0 transition-colors w-full"
                    :class="activeTab === index ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'"
                    @click="selectTab(index)"
                >
                    <span class="text-xs font-black shrink-0">
                        {{ String(index + 1).padStart(2, "0") }}
                    </span>
                    <span class="text-sm font-black leading-tight">
                        {{ section.name }}
                    </span>
                </button>
            </div>

            <div
                v-for="(section, index) in sections"
                :key="index"
                role="tabpanel"
                :id="`use-case-panel-${index}`"
                :aria-labelledby="`use-case-tab-${index}`"
                class="border-2 border-gray-900 p-6 bg-white flex-1"
                :class="activeTab === index ? '' : 'hidden'"
            >
                <p class="text-gray-600 text-sm leading-relaxed font-medium">
                    {{ section.copy }}
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t-2 border-gray-900">
                    <a
                        v-for="tool in featuredTools[index]"
                        :key="tool.slug"
                        :href="`/tools/${tool.slug}`"
                        class="border-2 border-dashed border-gray-200 p-4 hover:border-solid hover:border-gray-900 transition-colors no-underline block group"
                    >
                        <strong class="block text-sm font-black text-gray-900 group-hover:text-primary-500 transition-colors">
                            {{ tool.title }}
                        </strong>
                        <span class="text-xs text-gray-500 mt-1 line-clamp-3">
                            {{ tool.body }}
                        </span>
                    </a>
                </div>
            </div>
        </div>
    </section>
</template>
