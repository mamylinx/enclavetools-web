<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { compareRows, formatCompareValue, type ToolWithCategory } from '../utils/toolModel';
import { localStorageAdapter as storage } from '../lib/storage';

const props = defineProps<{
  tools: ToolWithCategory[];
}>();

const selected = ref<string[]>([]);
const differencesOnly = ref(false);

const allTools = computed(() => props.tools);
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
    storage.setItem('enclavetools-compare', JSON.stringify(selected.value));
    return;
  }

  try {
    selected.value = JSON.parse(storage.getItem('enclavetools-compare') || '[]').slice(0, 4);
  } catch {
    selected.value = [];
  }
}

function syncUrl() {
  const query = selected.value.length ? `?tools=${selected.value.join(',')}` : '';
  history.replaceState({}, '', `/compare${query}`);
  storage.setItem('enclavetools-compare', JSON.stringify(selected.value));
}

function handleCompareChanged(event: Event) {
  selected.value = ((event as CustomEvent<{ slugs?: string[] }>).detail?.slugs || []).slice(0, 4);
  syncUrl();
}

function remove(slug?: string) {
  selected.value = selected.value.filter((item) => item !== slug);
  syncUrl();
}

function addTool(event: Event) {
  const slug = (event.target as HTMLSelectElement).value;
  if (!slug || selected.value.includes(slug)) return;
  if (selected.value.length >= 4) {
    window.dispatchEvent(new CustomEvent('compare:limit'));
    return;
  }
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

onMounted(() => {
  loadFromUrl();
  window.addEventListener('compare:changed', handleCompareChanged);
});

onUnmounted(() => {
  window.removeEventListener('compare:changed', handleCompareChanged);
});
</script>

<template>
  <section class="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
    <div class="flex flex-col md:flex-row items-center gap-3 mb-8 p-4 bg-brand-bg border border-brand-forest/10 flex-wrap rounded-3xl">
      <select class="flex-1 w-full bg-white border border-brand-forest/10 px-4 h-12 font-bold text-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-teal cursor-pointer min-w-[200px] rounded-full" @change="addTool">
        <option value="">Add a tool</option>
        <option v-for="tool in allTools" :key="tool.slug" :value="tool.slug" :disabled="selected.includes(tool.slug || '')">
          {{ tool.title }}
        </option>
      </select>
      <label class="flex items-center gap-3 font-bold text-brand-forest/80 cursor-pointer whitespace-nowrap h-12"><input class="w-5 h-5 border border-brand-forest/10 text-brand-teal focus:ring-brand-teal  cursor-pointer" v-model="differencesOnly" type="checkbox" /> Show differences only</label>
      <button class="w-full md:w-auto px-4 h-12 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors cursor-pointer border-none rounded-full whitespace-nowrap inline-flex items-center shadow-sm" type="button" @click="copyMarkdown">Copy Markdown</button>
      <button class="w-full md:w-auto px-4 h-12 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors cursor-pointer border-none rounded-full whitespace-nowrap inline-flex items-center shadow-sm" type="button" @click="downloadCsv">Download CSV</button>
      <button class="w-full md:w-auto px-4 h-12 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors cursor-pointer border-none rounded-full whitespace-nowrap inline-flex items-center shadow-sm" type="button" @click="share">Share comparison</button>
    </div>

    <div v-if="selectedTools.length === 0" class="py-16 text-center bg-brand-bg border border-dashed border-brand-forest/20 text-brand-muted font-bold text-lg rounded-3xl">
      Select a tool to start comparing, or use the selector above.
    </div>

    <div v-else class="overflow-x-auto w-full border border-brand-forest/10 bg-white rounded-3xl">
      <table class="w-full text-left border-collapse min-w-[800px] table-fixed">
        <colgroup>
          <col />
          <col v-for="tool in selectedTools" :key="`col-${tool.slug}`" />
        </colgroup>
        <thead>
          <tr>
            <th class="p-4 border-b border-brand-forest/10 border-r border-brand-forest/10 bg-brand-bg font-bold text-brand-forest uppercase tracking-wider text-sm align-bottom">Attribute</th>
            <th class="p-4 border-b border-brand-forest/10 border-r border-brand-forest/10 last:border-r-0 bg-brand-bg font-bold text-brand-forest uppercase tracking-wider text-sm align-bottom" v-for="tool in selectedTools" :key="tool.slug">
              <div class="flex flex-col gap-3 items-start">
                <a class="text-brand-teal hover:text-brand-teal no-underline" :href="`/tools/${tool.slug}`">{{ tool.title }}</a>
                <button class="px-3 h-10 bg-white border border-brand-forest/10 text-brand-forest text-xs font-bold hover:bg-brand-teal hover:text-white hover:border-brand-teal transition-colors cursor-pointer inline-flex items-center rounded-full" type="button" @click="remove(tool.slug)">Remove</button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="hover:bg-brand-tealLight/50 transition-colors" v-for="[label, key] in visibleRows" :key="key">
            <td class="p-4 border-b border-brand-forest/10 border-r border-brand-forest/10 font-bold text-brand-forest">{{ label }}</td>
            <td class="p-4 border-b border-brand-forest/10 border-r border-brand-forest/10 last:border-r-0 text-brand-forest/80 leading-relaxed break-words" v-for="tool in selectedTools" :key="`${tool.slug}-${key}`">
              {{ valueFor(tool, key) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
