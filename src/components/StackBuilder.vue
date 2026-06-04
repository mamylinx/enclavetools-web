<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { categoryValue, enrichTool, getWorksWith, type ToolWithCategory } from '../utils/toolModel';

const props = defineProps<{
  tools: ToolWithCategory[];
}>();

const selected = ref<string[]>([]);
const copyStatus = ref<'idle' | 'copied' | 'failed'>('idle');
const allTools = computed(() => props.tools.map(enrichTool));
const stackTools = computed(() => selected.value
  .map((slug) => allTools.value.find((tool) => tool.slug === slug))
  .filter(Boolean) as ToolWithCategory[]);

const suggestions = computed(() => {
  const seen = new Set(selected.value);
  const suggested = stackTools.value.flatMap((tool) => getWorksWith(tool, allTools.value, 6));
  return suggested.filter((tool, index, arr) => tool.slug && !seen.has(tool.slug) && arr.findIndex((item) => item.slug === tool.slug) === index).slice(0, 8);
});

const groupedStack = computed(() => {
  const groups = new Map<string, ToolWithCategory[]>();
  stackTools.value.forEach((tool) => {
    const category = categoryValue(tool);
    groups.set(category, [...(groups.get(category) || []), tool]);
  });
  return Array.from(groups.entries());
});

function load() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = (params.get('stack') || '').split(',').map((slug) => slug.trim()).filter(Boolean);
  if (fromUrl.length) {
    selected.value = fromUrl.slice(0, 8);
    localStorage.setItem('enclavetools-stack', JSON.stringify(selected.value));
    return;
  }

  try {
    selected.value = JSON.parse(localStorage.getItem('enclavetools-stack') || '[]').slice(0, 8);
  } catch {
    selected.value = [];
  }

  if (selected.value.length) sync();
}

function sync() {
  const query = selected.value.length ? `?stack=${selected.value.join(',')}` : '';
  history.replaceState({}, '', `/stack-builder${query}`);
  localStorage.setItem('enclavetools-stack', JSON.stringify(selected.value));
}

function add(slug?: string) {
  if (!slug || selected.value.includes(slug) || selected.value.length >= 8) return;
  selected.value.push(slug);
  sync();
}

function remove(slug?: string) {
  selected.value = selected.value.filter((item) => item !== slug);
  sync();
}

function addFromSelect(event: Event) {
  add((event.target as HTMLSelectElement).value);
  (event.target as HTMLSelectElement).value = '';
}

function stackText() {
  const lines = stackTools.value.map((tool) => `- ${tool.title} (${categoryValue(tool)}): ${tool.plain_description || tool.body}`);
  return [window.location.href, '', ...lines].join('\n').trim();
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) throw new Error('Copy command failed');
}

async function copyStack() {
  copyStatus.value = 'idle';
  try {
    if (selected.value.length) sync();
    await copyText(stackText());
    copyStatus.value = 'copied';
  } catch {
    copyStatus.value = 'failed';
  } finally {
    window.setTimeout(() => {
      copyStatus.value = 'idle';
    }, 2400);
  }
}

onMounted(load);
</script>

<template>
  <section class="max-w-[1400px] mx-auto px-4 md:px-10 py-12 lg:py-20">
    <div class="flex flex-col md:flex-row items-center gap-4 mb-12 p-6 bg-gray-50 border-2 border-gray-900 flex-wrap">
      <select
        class="flex-1 w-full bg-white border-2 border-gray-900 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500  cursor-pointer min-w-[200px]"
        @change="addFromSelect">
        <option value="">Add a tool to the stack</option>
        <option v-for="tool in allTools" :key="tool.slug" :value="tool.slug"
          :disabled="selected.includes(tool.slug || '')">
          {{ tool.title }}
        </option>
      </select>
      <button
        class="w-full md:w-auto px-6 py-3 bg-gray-900 text-white font-bold hover:bg-primary-500 transition-colors cursor-pointer border-none whitespace-nowrap "
        type="button" @click="copyStack">
        {{ copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy stack link' }}
      </button>
      <a class="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white font-bold hover:bg-primary-500 transition-colors border-none no-underline "
        :href="`/compare?tools=${selected.slice(0, 4).join(',')}`">Compare first 4</a>
    </div>

    <div v-if="stackTools.length === 0"
      class="py-20 text-center bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500 font-bold text-lg">
      Start with an inference engine, chat interface, document tool, or vector database.
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
      <section class="flex flex-col gap-6">
        <h2 class="text-2xl font-black text-gray-900 pb-4 border-b-2 border-gray-900">Current stack</h2>
        <div v-for="[category, tools] in groupedStack" :key="category" class="mb-4">
          <h3 class="text-sm font-black text-primary-500 uppercase tracking-widest mb-4">{{ category }}</h3>
          <article v-for="tool in tools" :key="tool.slug"
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white border-2 border-gray-200 mb-4 gap-4 transition-colors hover:border-gray-900">
            <div class="flex-1">
              <strong class="block text-lg font-black text-gray-900 mb-1">{{ tool.title }}</strong>
              <p class="text-sm text-gray-600 m-0">{{ tool.plain_description || tool.body }}</p>
            </div>
            <button
              class="shrink-0 px-4 py-2 bg-white border-2 border-gray-900 text-gray-900 font-bold hover:bg-gray-900 hover:text-white transition-colors cursor-pointer "
              type="button" @click="remove(tool.slug)">Remove</button>
          </article>
        </div>
      </section>

      <section class="flex flex-col gap-6">
        <h2 class="text-2xl font-black text-gray-900 pb-4 border-b-2 border-gray-900">Works well with</h2>
        <div class="flex flex-col gap-4">
          <article v-for="tool in suggestions" :key="tool.slug"
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-gray-50 border-2 border-dashed border-gray-200 gap-4 transition-colors hover:border-solid hover:border-gray-900">
            <div class="flex-1">
              <strong class="block text-lg font-black text-gray-900 mb-1">{{ tool.title }}</strong>
              <span
                class="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs uppercase tracking-wider font-bold mb-2">{{
                categoryValue(tool) }}</span>
              <p class="text-sm text-gray-600 m-0">{{ tool.plain_description || tool.body }}</p>
            </div>
            <button
              class="shrink-0 px-4 py-2 bg-white border-2 border-gray-900 text-gray-900 font-bold hover:bg-gray-900 hover:text-white transition-colors cursor-pointer "
              type="button" @click="add(tool.slug)">Add</button>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>
