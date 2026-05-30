<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { compareRows, enrichTool, formatCompareValue, type ToolWithCategory } from '../utils/toolModel';

const props = defineProps<{
  tools: ToolWithCategory[];
}>();

const selected = ref<string[]>([]);
const differencesOnly = ref(false);

const allTools = computed(() => props.tools.map(enrichTool));
const selectedTools = computed(() => selected.value
  .map((slug) => allTools.value.find((tool) => tool.slug === slug))
  .filter(Boolean)
  .slice(0, 4) as ToolWithCategory[]);

const visibleRows = computed(() => compareRows.filter(([, key]) => {
  if (!differencesOnly.value) return true;
  const values = selectedTools.value.map((tool) => valueFor(tool, key));
  return new Set(values).size > 1;
}));

function valueFor(tool: ToolWithCategory, key: string): string {
  return formatCompareValue((tool as Record<string, unknown>)[key]);
}

function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = (params.get('tools') || '').split(',').map((slug) => slug.trim()).filter(Boolean);
  if (fromUrl.length) {
    selected.value = fromUrl.slice(0, 4);
    localStorage.setItem('enclavetools-compare', JSON.stringify(selected.value));
    return;
  }

  try {
    selected.value = JSON.parse(localStorage.getItem('enclavetools-compare') || '[]').slice(0, 4);
  } catch {
    selected.value = [];
  }
}

function syncUrl() {
  const query = selected.value.length ? `?tools=${selected.value.join(',')}` : '';
  history.replaceState({}, '', `/compare${query}`);
  localStorage.setItem('enclavetools-compare', JSON.stringify(selected.value));
}

function remove(slug?: string) {
  selected.value = selected.value.filter((item) => item !== slug);
  syncUrl();
}

function addTool(event: Event) {
  const slug = (event.target as HTMLSelectElement).value;
  if (!slug || selected.value.includes(slug) || selected.value.length >= 4) return;
  selected.value.push(slug);
  syncUrl();
  (event.target as HTMLSelectElement).value = '';
}

function asMarkdown() {
  const header = ['Attribute', ...selectedTools.value.map((tool) => tool.title)];
  const lines = [
    `| ${header.join(' |')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...visibleRows.value.map(([label, key]) => `| ${[label, ...selectedTools.value.map((tool) => valueFor(tool, key))].join(' | ')} |`),
  ];
  return lines.join('\n');
}

function asCsv() {
  const esc = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [
    ['Attribute', ...selectedTools.value.map((tool) => tool.title)].map(esc).join(','),
    ...visibleRows.value.map(([label, key]) => [label, ...selectedTools.value.map((tool) => valueFor(tool, key))].map(esc).join(',')),
  ].join('\n');
}

async function copyMarkdown() {
  await navigator.clipboard.writeText(asMarkdown());
}

function downloadCsv() {
  const blob = new Blob([asCsv()], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `enclavetools-comparison-${selected.value.join('-') || 'tools'}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function share() {
  navigator.clipboard.writeText(window.location.href);
}

onMounted(loadFromUrl);
</script>

<template>
  <section class="max-w-[1400px] mx-auto px-4 md:px-10 py-12 lg:py-20">
    <div class="flex flex-col md:flex-row items-center gap-4 mb-12 p-6 bg-gray-50 border-2 border-gray-900 flex-wrap">
      <select class="flex-1 w-full bg-white border-2 border-gray-900 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-none cursor-pointer min-w-[200px]" @change="addTool">
        <option value="">Add a tool</option>
        <option v-for="tool in allTools" :key="tool.slug" :value="tool.slug" :disabled="selected.includes(tool.slug || '')">
          {{ tool.title }}
        </option>
      </select>
      <label class="flex items-center gap-3 font-bold text-gray-700 cursor-pointer whitespace-nowrap"><input class="w-5 h-5 border-2 border-gray-900 text-primary-500 focus:ring-primary-500 rounded-none cursor-pointer" v-model="differencesOnly" type="checkbox" /> Show differences only</label>
      <button class="w-full md:w-auto px-6 py-3 bg-gray-900 text-white font-bold hover:bg-primary-500 transition-colors cursor-pointer border-none whitespace-nowrap rounded-none" type="button" @click="copyMarkdown">Copy Markdown</button>
      <button class="w-full md:w-auto px-6 py-3 bg-gray-900 text-white font-bold hover:bg-primary-500 transition-colors cursor-pointer border-none whitespace-nowrap rounded-none" type="button" @click="downloadCsv">Download CSV</button>
      <button class="w-full md:w-auto px-6 py-3 bg-gray-900 text-white font-bold hover:bg-primary-500 transition-colors cursor-pointer border-none whitespace-nowrap rounded-none" type="button" @click="share">Share comparison</button>
    </div>

    <div v-if="selectedTools.length < 2" class="py-20 text-center bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500 font-bold text-lg">
      Select at least two tools from Browse or use the selector above.
    </div>

    <div v-else class="overflow-x-auto w-full border-2 border-gray-900 bg-white">
      <table class="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th class="p-5 border-b-2 border-gray-900 border-r-2 bg-gray-50 font-black text-gray-900 uppercase tracking-wider text-sm align-bottom min-w-[150px]">Attribute</th>
            <th class="p-5 border-b-2 border-gray-900 border-r-2 last:border-r-0 bg-gray-50 font-black text-gray-900 uppercase tracking-wider text-sm align-bottom min-w-[200px]" v-for="tool in selectedTools" :key="tool.slug">
              <div class="flex flex-col gap-3 items-start">
                <a class="text-primary-500 hover:text-primary-600 no-underline" :href="`/tools/${tool.slug}`">{{ tool.title }}</a>
                <button class="px-3 py-1.5 bg-transparent border-2 border-gray-900 text-gray-900 text-xs font-bold hover:bg-gray-900 hover:text-white transition-colors cursor-pointer rounded-none" type="button" @click="remove(tool.slug)">Remove</button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="hover:bg-gray-50/50 transition-colors" v-for="[label, key] in visibleRows" :key="key">
            <td class="p-5 border-b border-gray-200 border-r-2 border-gray-900 font-bold text-gray-900">{{ label }}</td>
            <td class="p-5 border-b border-gray-200 border-r last:border-r-0 text-gray-700 leading-relaxed" v-for="tool in selectedTools" :key="`${tool.slug}-${key}`">
              {{ valueFor(tool, key) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
