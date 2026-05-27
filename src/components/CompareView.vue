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
  <section class="decision-page">
    <header class="decision-header">
      <p class="section-kicker">Compare</p>
      <h1>Side-by-side tool decisions.</h1>
      <p>Compare up to four tools across license, privacy, API, setup, and hardware attributes.</p>
    </header>

    <div class="decision-controls">
      <select @change="addTool">
        <option value="">Add a tool</option>
        <option v-for="tool in allTools" :key="tool.slug" :value="tool.slug" :disabled="selected.includes(tool.slug || '')">
          {{ tool.title }}
        </option>
      </select>
      <label><input v-model="differencesOnly" type="checkbox" /> Show differences only</label>
      <button type="button" @click="copyMarkdown">Copy Markdown</button>
      <button type="button" @click="downloadCsv">Download CSV</button>
      <button type="button" @click="share">Share comparison</button>
    </div>

    <div v-if="selectedTools.length < 2" class="empty-decision">
      Select at least two tools from Browse or use the selector above.
    </div>

    <div v-else class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th>Attribute</th>
            <th v-for="tool in selectedTools" :key="tool.slug">
              <a :href="`/tools/${tool.slug}`">{{ tool.title }}</a>
              <button type="button" @click="remove(tool.slug)">Remove</button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[label, key] in visibleRows" :key="key">
            <td>{{ label }}</td>
            <td v-for="tool in selectedTools" :key="`${tool.slug}-${key}`">
              {{ valueFor(tool, key) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
