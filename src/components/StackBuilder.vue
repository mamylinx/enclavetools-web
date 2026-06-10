<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { categoryValue, enrichTool, getWorksWith, type ToolWithCategory } from '../utils/toolModel';
import {
  getAll, addTool, removeTool,
  rename as renameStack, remove as deleteStack,
  create as createStack, setActive,
  ensureDefault, type StoredStack,
} from '../utils/stacks';

const props = defineProps<{
  tools: ToolWithCategory[];
}>();

const stacks = ref<StoredStack[]>([]);
const activeId = ref<string>('');
const renaming = ref(false);
const renameDraft = ref('');
const copyStatus = ref<'idle' | 'copied' | 'failed'>('idle');
const showDeleteConfirm = ref(false);
const showOverflow = ref(false);
const creating = ref(false);
const createDraft = ref('');

// ── Tool search combobox ──────────────────────────────────────────
const searchQuery = ref('');
const searchOpen = ref(false);
const searchHighlight = ref(-1); // flat index into filteredFlat
const searchInputEl = ref<HTMLInputElement | null>(null);
const searchDropEl = ref<HTMLDivElement | null>(null);

const allTools = computed(() => props.tools.map(enrichTool));
const activeStack = computed(() => stacks.value.find((s) => s.id === activeId.value));
const stackTools = computed(() => (activeStack.value?.tools || [])
  .map((slug) => allTools.value.find((tool) => tool.slug === slug))
  .filter(Boolean) as ToolWithCategory[]);

const suggestions = computed(() => {
  const seen = new Set(activeStack.value?.tools || []);
  const suggested = stackTools.value.flatMap((tool) => getWorksWith(tool, allTools.value, 6));
  return suggested.filter((tool, index, arr) => tool.slug && !seen.has(tool.slug) && arr.findIndex((item) => item.slug === tool.slug) === index).slice(0, 8);
});

const groupedStack = computed(() => {
  const groups = new Map<string, ToolWithCategory[]>();
  stackTools.value.forEach((tool) => {
    const cat = categoryValue(tool);
    groups.set(cat, [...(groups.get(cat) || []), tool]);
  });
  return Array.from(groups.entries());
});

// Filtered tools grouped by category
const filteredGroups = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const inStack = new Set(activeStack.value?.tools || []);
  const source = q
    ? allTools.value.filter(
        (t) =>
          !inStack.has(t.slug || '') &&
          (t.title?.toLowerCase().includes(q) ||
            t.category?.toLowerCase().includes(q) ||
            t.body?.toLowerCase().includes(q)),
      )
    : allTools.value.filter((t) => !inStack.has(t.slug || ''));

  const groups = new Map<string, ToolWithCategory[]>();
  source.forEach((t) => {
    const cat = categoryValue(t) || 'Other';
    groups.set(cat, [...(groups.get(cat) || []), t]);
  });
  return Array.from(groups.entries());
});

// Flat list for keyboard navigation
const filteredFlat = computed(() =>
  filteredGroups.value.flatMap(([, tools]) => tools),
);

function openSearch() {
  searchOpen.value = true;
  searchHighlight.value = -1;
}

function closeSearch() {
  searchOpen.value = false;
  searchQuery.value = '';
  searchHighlight.value = -1;
}

function pickTool(slug: string | undefined) {
  if (!slug) return;
  if (!activeId.value) {
    const s = createStack('My Stack');
    activeId.value = s.id;
    refresh();
    pushUrl();
  }
  add(slug);
  closeSearch();
  nextTick(() => searchInputEl.value?.focus());
}

function onSearchKeydown(e: KeyboardEvent) {
  const flat = filteredFlat.value;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchHighlight.value = Math.min(searchHighlight.value + 1, flat.length - 1);
    scrollHighlightIntoView();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchHighlight.value = Math.max(searchHighlight.value - 1, 0);
    scrollHighlightIntoView();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (searchHighlight.value >= 0 && flat[searchHighlight.value]) {
      pickTool(flat[searchHighlight.value].slug);
    }
  } else if (e.key === 'Escape') {
    closeSearch();
  } else {
    searchHighlight.value = -1;
  }
}

function scrollHighlightIntoView() {
  nextTick(() => {
    const el = searchDropEl.value?.querySelector('[data-highlighted="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  });
}

function highlightIndexFor(slug: string | undefined) {
  if (!slug) return false;
  const idx = filteredFlat.value.findIndex((t) => t.slug === slug);
  return idx === searchHighlight.value;
}

// ── rest of StackBuilder ──────────────────────────────────────────

function refresh() {
  stacks.value = getAll();
  if (!stacks.value.find((s) => s.id === activeId.value)) {
    activeId.value = stacks.value[0]?.id || '';
  }
}

function pushUrl() {
  const q = activeId.value ? `?stack=${activeId.value}` : '';
  history.replaceState({}, '', `/stack-builder${q}`);
}

function switchStack(id: string) {
  if (id === activeId.value) return;
  activeId.value = id;
  setActive(id);
  pushUrl();
  showOverflow.value = false;
}

function add(slug?: string) {
  if (!slug || !activeId.value) return;
  addTool(activeId.value, slug);
  refresh();
}

function remove(slug?: string) {
  if (!slug || !activeId.value) return;
  removeTool(activeId.value, slug);
  refresh();
}

function handleDelete() {
  if (!activeId.value) return;
  deleteStack(activeId.value);
  refresh();
  showDeleteConfirm.value = false;
  showOverflow.value = false;
  pushUrl();
}

function handleCreate() {
  createDraft.value = '';
  creating.value = true;
  showOverflow.value = false;
  nextTick(() => document.getElementById('ci')?.focus());
}

function commitCreate() {
  if (!createDraft.value.trim()) { creating.value = false; return; }
  const s = createStack(createDraft.value.trim());
  activeId.value = s.id;
  creating.value = false;
  refresh();
  pushUrl();
}

function cancelCreate() {
  creating.value = false;
}

function startRename() {
  const s = activeStack.value;
  if (!s) return;
  renameDraft.value = s.name;
  renaming.value = true;
  showOverflow.value = false;
  nextTick(() => {
    const el = document.getElementById('ri');
    el?.focus();
    (el as HTMLInputElement)?.select();
  });
}

function commitRename() {
  if (!activeId.value || !renameDraft.value.trim()) return;
  renameStack(activeId.value, renameDraft.value.trim());
  refresh();
  renaming.value = false;
}

function cancelRename() {
  renaming.value = false;
}

function stackUrl() {
  const tools = activeStack.value?.tools || [];
  return tools.length
    ? `${window.location.origin}/stack-builder?tools=${tools.join(',')}`
    : '';
}

function copyStackLink() {
  const url = stackUrl();
  if (!url) return;
  copyStatus.value = 'idle';
  copyText(url)
    .then(() => { copyStatus.value = 'copied'; })
    .catch(() => { copyStatus.value = 'failed'; })
    .finally(() => { window.setTimeout(() => { copyStatus.value = 'idle'; }, 2400); });
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      /* fall through */
    }
  }
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  if (!ok) throw new Error('Copy failed');
}

function addAllSuggestions() {
  suggestions.value.forEach((tool) => add(tool.slug));
}

onMounted(() => {
  // Close overflow menu when clicking outside
  document.addEventListener('click', (e) => {
    if (showOverflow.value && !(e.target as Element).closest('#ow')) {
      showOverflow.value = false;
    }
    // Close search combobox when clicking outside
    const anchor = document.getElementById('tool-search-anchor');
    if (searchOpen.value && anchor && !anchor.contains(e.target as Node)) {
      closeSearch();
    }
  });

  const params = new URLSearchParams(window.location.search);
  const toolsParam = params.get('tools');
  if (toolsParam) {
    const ids = toolsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8);
    const s = createStack('Shared Stack');
    ids.forEach((slug) => addTool(s.id, slug));
    activeId.value = s.id;
    refresh();
    pushUrl();
    return;
  }
  const stackId = params.get('stack');
  const all = getAll();
  if (stackId && all.find((s) => s.id === stackId)) {
    activeId.value = stackId;
    setActive(stackId);
    pushUrl();
    return;
  }
  if (all.length) {
    activeId.value = all[0].id;
    setActive(all[0].id);
    pushUrl();
    refresh();
    return;
  }
  activeId.value = '';
  pushUrl();
  refresh();
});

watch(activeId, () => { pushUrl(); refresh(); });
</script>

<template>
  <section class="max-w-[1400px] mx-auto px-4 md:px-8 py-12">

    <!-- First-time CTA -->
    <div v-if="stacks.length === 0 && !creating"
      class="py-16 lg:py-24 text-center bg-gray-50 border-2 border-dashed border-gray-300">
      <h2 class="text-2xl font-black text-gray-900 mb-4">No stacks yet</h2>
      <p class="text-gray-600 font-bold mb-8 max-w-md mx-auto">
        Create a stack to collect compatible self-hosted AI tools.
      </p>
      <button type="button" @click="handleCreate"
        class="inline-flex items-center gap-2 px-4 h-12 bg-gray-900 text-white font-black hover:bg-primary-500 transition-colors cursor-pointer border-none text-sm uppercase tracking-wider">
        + Create your first stack
      </button>
    </div>

    <template v-else>

      <!-- Merged toolbar: create form replaces toolbar when active -->
      <div v-if="stacks.length > 0 || creating"
        class="flex flex-col md:flex-row items-center gap-3 mb-3 p-4 bg-gray-50 border-2 border-gray-900 flex-wrap">
        <div v-if="creating" class="flex flex-col md:flex-row items-center gap-3 w-full">
          <input id="ci" type="text" v-model="createDraft" @keydown.enter="commitCreate" @keydown.escape="cancelCreate"
            placeholder="Name the new stack"
            class="flex-1 w-full bg-white border-2 border-gray-900 px-4 h-12 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            maxlength="30" />
          <div class="flex gap-2 w-full md:w-auto">
            <button type="button" @click="commitCreate"
              class="px-4 h-12 bg-gray-900 text-white font-black hover:bg-primary-500 transition-colors cursor-pointer border-none">Create</button>
            <button type="button" @click="cancelCreate"
              class="px-4 h-12 bg-white border-2 border-gray-900 text-gray-900 font-black hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
          </div>
        </div>
        <template v-else>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div v-if="stacks.length === 1"
              class="flex flex-1 items-center h-12 px-3 bg-white border-2 border-gray-900 min-w-[160px] font-bold text-gray-900 gap-2 truncate">
              <span class="truncate">{{ activeStack?.name }}</span>
              <span class="shrink-0 text-gray-400 text-sm">({{ activeStack?.tools.length || 0 }})</span>
            </div>
            <select v-else
              class="flex-1 bg-white border-2 border-gray-900 px-3 h-12 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer min-w-[160px]"
              :value="activeId" @change="switchStack(($event.target as HTMLSelectElement).value)"
              aria-label="Select stack">
              <option v-for="s in stacks" :key="s.id" :value="s.id">{{ s.name }} ({{ s.tools.length }})</option>
            </select>

            <!-- Rename inline -->
            <div v-if="renaming" class="flex items-center gap-2 flex-1">
              <input id="ri" type="text" v-model="renameDraft" @keydown.enter="commitRename"
                @keydown.escape="cancelRename"
                class="flex-1 bg-white border-2 border-gray-900 px-3 h-12 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                maxlength="30" />
              <button type="button" @click="commitRename"
                class="shrink-0 px-4 h-12 bg-gray-900 text-white font-black hover:bg-primary-500 transition-colors cursor-pointer border-none text-sm">Save</button>
              <button type="button" @click="cancelRename"
                class="shrink-0 px-4 h-12 bg-white border-2 border-gray-900 text-gray-900 font-black hover:bg-gray-100 transition-colors cursor-pointer text-sm">Cancel</button>
            </div>

            <!-- Copy link -->
            <button v-if="!renaming" type="button" @click="copyStackLink"
              class="shrink-0 w-12 h-12 bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors cursor-pointer inline-flex items-center justify-center"
              :aria-label="copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy stack link'"
              :title="copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy stack link'">
              <svg v-if="copyStatus === 'idle'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <svg v-else-if="copyStatus === 'copied'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <!-- Overflow -->
            <div v-if="!renaming" id="ow" class="relative shrink-0">
              <button type="button" @click="showOverflow = !showOverflow"
                class="w-12 h-12 bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors cursor-pointer inline-flex items-center justify-center"
                aria-label="Stack actions">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              <div v-if="showOverflow"
                class="absolute right-0 top-full mt-1 z-50 bg-white border-2 border-gray-900 shadow-brutal min-w-[180px]">
                <button type="button" @click="startRename"
                  class="flex items-center gap-3 w-full text-left px-4 h-12 text-sm font-bold text-gray-900 hover:bg-gray-100 border-b-2 border-gray-200 cursor-pointer bg-transparent">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                  Rename
                </button>
                <button type="button" @click="showDeleteConfirm = true; showOverflow = false"
                  class="flex items-center gap-3 w-full text-left px-4 h-12 text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer bg-transparent">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            <!-- New stack -->
            <button v-if="!renaming" type="button" @click="handleCreate"
              class="shrink-0 w-12 h-12 bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors cursor-pointer inline-flex items-center justify-center"
              aria-label="Create new stack">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </button>
          </div>

          <!-- ── Searchable tool combobox ── -->
          <div id="tool-search-anchor" class="flex items-center gap-2 w-full md:w-auto md:border-l-2 md:border-gray-300 md:pl-4 relative">
            <div class="relative w-full md:w-auto">
              <!-- Input trigger -->
              <div class="relative flex items-center">
                <svg class="absolute left-3 text-gray-400 pointer-events-none shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  ref="searchInputEl"
                  type="text"
                  v-model="searchQuery"
                  @focus="openSearch"
                  @input="openSearch"
                  @keydown="onSearchKeydown"
                  placeholder="Search and add a tool…"
                  autocomplete="off"
                  class="w-full md:w-72 bg-gray-900 text-white border-2 border-gray-900 pl-8 pr-8 h-12 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400 cursor-text"
                  aria-label="Search tools to add"
                  aria-autocomplete="list"
                  :aria-expanded="searchOpen"
                  aria-controls="tool-search-dropdown"
                  role="combobox"
                />
                <!-- Clear button -->
                <button
                  v-if="searchQuery"
                  type="button"
                  @click.stop="searchQuery = ''; searchInputEl?.focus()"
                  class="absolute right-3 text-gray-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent p-0 leading-none"
                  aria-label="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <!-- Dropdown results -->
              <div
                v-if="searchOpen"
                id="tool-search-dropdown"
                ref="searchDropEl"
                role="listbox"
                aria-label="Tool search results"
                class="absolute left-0 right-0 top-full mt-1 z-50 bg-white border-2 border-gray-900 shadow-brutal max-h-80 overflow-y-auto"
                style="min-width: 320px"
              >
                <!-- No results -->
                <div v-if="filteredGroups.length === 0" class="px-4 py-6 text-sm text-gray-500 font-bold text-center">
                  No tools match "{{ searchQuery }}"
                </div>

                <!-- Grouped results -->
                <template v-for="[cat, tools] in filteredGroups" :key="cat">
                  <div class="px-3 pt-2 pb-1 text-xs font-black uppercase tracking-widest text-gray-400 bg-gray-50 border-b-2 border-gray-200 sticky top-0">
                    {{ cat }}
                  </div>
                  <button
                    v-for="tool in tools"
                    :key="tool.slug"
                    type="button"
                    role="option"
                    :aria-selected="highlightIndexFor(tool.slug)"
                    :data-highlighted="highlightIndexFor(tool.slug) ? 'true' : undefined"
                    @click.stop="pickTool(tool.slug)"
                    @mouseenter="searchHighlight = filteredFlat.findIndex(t => t.slug === tool.slug)"
                    :class="[
                      'w-full text-left px-4 py-2 flex flex-col gap-2 border-b-2 border-gray-200 last:border-0 transition-colors cursor-pointer border-none outline-none',
                      highlightIndexFor(tool.slug)
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-900 hover:bg-gray-50'
                    ]"
                  >
                    <span class="font-black text-sm leading-tight">{{ tool.title }}</span>
                    <span
                      :class="['text-xs leading-snug truncate', highlightIndexFor(tool.slug) ? 'text-white/80' : 'text-gray-500']"
                    >{{ (tool.plain_description || tool.body || '').slice(0, 80) }}</span>
                  </button>
                </template>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Delete confirm -->
      <div v-if="showDeleteConfirm" class="flex items-center gap-4 mb-3 p-4 bg-red-50 border-2 border-red-600">
        <span class="font-bold text-red-800">Delete this stack?</span>
        <button type="button" @click="handleDelete"
          class="px-4 h-10 bg-red-600 text-white font-black hover:bg-red-700 transition-colors cursor-pointer border-none">Delete</button>
        <button type="button" @click="showDeleteConfirm = false"
          class="px-4 h-10 bg-white border-2 border-gray-900 text-gray-900 font-black hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
      </div>

      <!-- Empty state -->
      <div v-if="stackTools.length === 0"
        class="py-16 text-center bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500 font-bold text-lg">
        Start with an inference engine, chat interface, document tool, or vector database.
      </div>

      <!-- Stack content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <section class="flex flex-col gap-4">
          <h2 class="text-2xl font-black text-gray-900 pb-4 border-b-2 border-gray-900">Current stack - {{
            activeStack?.name }}</h2>
          <div v-for="[cat, tools] in groupedStack" :key="cat" class="mb-4">
            <h3 class="text-sm font-black text-primary-500 uppercase tracking-widest mb-4">{{ cat }}</h3>
            <article v-for="tool in tools" :key="tool.slug"
              class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border-2 border-gray-200 mb-4 gap-4 transition-colors hover:border-gray-900">
              <div class="flex-1">
                <strong class="block text-lg font-black text-gray-900 mb-1">{{ tool.title }}</strong>
                <p class="text-sm text-gray-600 m-0">{{ tool.plain_description || tool.body }}</p>
              </div>
              <button type="button" @click="remove(tool.slug)"
                class="shrink-0 px-3 h-10 bg-white border-2 border-gray-900 text-gray-900 font-bold hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors cursor-pointer inline-flex items-center justify-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                Remove
              </button>
            </article>
          </div>
        </section>

        <section class="flex flex-col gap-4">
          <div class="flex flex-col gap-4">
            <article v-for="tool in suggestions" :key="tool.slug"
              class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-gray-50 border-2 border-dashed border-gray-200 gap-4 transition-colors hover:border-solid hover:border-gray-900">
              <div class="flex-1">
                <strong class="block text-lg font-black text-gray-900 mb-1">{{ tool.title }}</strong>
                <span
                  class="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs uppercase tracking-wider font-bold mb-2">{{
                  categoryValue(tool) }}</span>
                <p class="text-sm text-gray-600 m-0">{{ tool.plain_description || tool.body }}</p>
              </div>
              <button type="button" @click="add(tool.slug)"
                class="shrink-0 px-3 h-10 bg-white border-2 border-gray-900 text-gray-900 font-bold hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors cursor-pointer inline-flex items-center justify-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Add
              </button>
            </article>
          </div>
        </section>
      </div>

    </template>
  </section>
</template>
