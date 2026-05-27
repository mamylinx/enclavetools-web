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
  <section class="decision-page">
    <header class="decision-header">
      <p class="section-kicker">Stack builder</p>
      <h1>Assemble a private AI stack.</h1>
      <p>Combine complementary tools for inference, chat, RAG, vector storage, deployment, and monitoring. Your stack is local to the browser and shareable through the URL.</p>
    </header>

    <div class="decision-controls">
      <select @change="addFromSelect">
        <option value="">Add a tool to the stack</option>
        <option v-for="tool in allTools" :key="tool.slug" :value="tool.slug" :disabled="selected.includes(tool.slug || '')">
          {{ tool.title }}
        </option>
      </select>
      <button type="button" @click="copyStack">
        {{ copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy stack link' }}
      </button>
      <a :href="`/compare?tools=${selected.slice(0, 4).join(',')}`">Compare first 4</a>
    </div>

    <div v-if="stackTools.length === 0" class="empty-decision">
      Start with an inference engine, chat interface, document tool, or vector database.
    </div>

    <div v-else class="stack-layout">
      <section class="stack-column">
        <h2>Current stack</h2>
        <div v-for="[category, tools] in groupedStack" :key="category" class="stack-group">
          <h3>{{ category }}</h3>
          <article v-for="tool in tools" :key="tool.slug" class="stack-item">
            <div>
              <strong>{{ tool.title }}</strong>
              <p>{{ tool.plain_description || tool.body }}</p>
            </div>
            <button type="button" @click="remove(tool.slug)">Remove</button>
          </article>
        </div>
      </section>

      <section class="stack-column">
        <h2>Works well with</h2>
        <article v-for="tool in suggestions" :key="tool.slug" class="stack-item suggested">
          <div>
            <strong>{{ tool.title }}</strong>
            <span>{{ categoryValue(tool) }}</span>
            <p>{{ tool.plain_description || tool.body }}</p>
          </div>
          <button type="button" @click="add(tool.slug)">Add</button>
        </article>
      </section>
    </div>
  </section>
</template>
