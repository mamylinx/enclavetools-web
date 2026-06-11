<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { enrichTool, getWorksWith, type ToolWithCategory } from '../utils/toolModel';
import { create as createStack, setActive, ensureDefault } from '../utils/stacks';
import { useStackCrud } from '../composables/useStackCrud';
import { useToolSearch } from '../composables/useToolSearch';
import { useClipboard } from '../composables/useClipboard';
import StackToolbar from './stack/StackToolbar.vue';
import ToolSearchCombobox from './stack/ToolSearchCombobox.vue';
import StackCurrent from './stack/StackCurrent.vue';
import StackSuggestions from './stack/StackSuggestions.vue';

const props = defineProps<{
  tools: ToolWithCategory[];
}>();

const {
  stacks, activeId, activeStack, refresh, switchStack,
  addToolToStack, removeToolFromStack, deleteActiveStack,
  createNewStack, renameActiveStack,
} = useStackCrud();

const allTools = computed(() => props.tools.map(enrichTool));

const search = useToolSearch(
  () => allTools.value,
  () => new Set(activeStack.value?.tools || []),
);

const { status: copyStatus, copy } = useClipboard();

const renaming = ref(false);
const renameDraft = ref('');
const showDeleteConfirm = ref(false);
const showOverflow = ref(false);
const creating = ref(false);
const createDraft = ref('');

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
    const cat = Array.isArray(tool.category) ? tool.category[0] || '' : tool.category || '';
    groups.set(cat, [...(groups.get(cat) || []), tool]);
  });
  return Array.from(groups.entries());
});

function pushUrl() {
  const q = activeId.value ? `?stack=${activeId.value}` : '';
  history.replaceState({}, '', `/stack-builder${q}`);
}

function pickTool(slug: string | undefined) {
  if (!slug) return;
  if (!activeId.value) {
    const s = createNewStack('My Stack');
    activeId.value = s.id;
    refresh();
    pushUrl();
  }
  addToolToStack(slug);
  search.close();
  nextTick(() => search.inputEl.value?.focus());
}

function onSearchKeydown(e: KeyboardEvent) {
  const slug = search.onKeydown(e);
  if (slug) pickTool(slug);
}

function handleDelete() {
  deleteActiveStack();
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
  createNewStack(createDraft.value.trim());
  creating.value = false;
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
  renameActiveStack(renameDraft.value.trim());
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
  copy(url);
}

function addAllSuggestions() {
  suggestions.value.forEach((tool) => addToolToStack(tool.slug));
}

onMounted(() => {
  document.addEventListener('click', (e) => {
    if (showOverflow.value && !(e.target as Element).closest('#ow')) {
      showOverflow.value = false;
    }
    const anchor = document.getElementById('tool-search-anchor');
    if (search.isOpen.value && anchor && !anchor.contains(e.target as Node)) {
      search.close();
    }
  });

  const params = new URLSearchParams(window.location.search);
  const toolsParam = params.get('tools');
  if (toolsParam) {
    const ids = toolsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8);
    const s = createStack('Shared Stack');
    ids.forEach((slug) => addToolToStack(slug));
    activeId.value = s.id;
    refresh();
    pushUrl();
    return;
  }
  const stackId = params.get('stack');
  const all = stacks.value;
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
      <StackToolbar
        :stacks="stacks"
        :active-id="activeId"
        :active-stack="activeStack"
        :creating="creating"
        :renaming="renaming"
        :create-draft="createDraft"
        :rename-draft="renameDraft"
        @switch="switchStack"
        @update:create-draft="createDraft = $event"
        @update:rename-draft="renameDraft = $event"
        @submit-create="commitCreate()"
        @submit-rename="commitRename()"
        @start-create="handleCreate"
        @cancel-create="cancelCreate"
        @cancel-rename="cancelRename"
      >
        <template #actions>
          <button v-if="!renaming" type="button" @click="copyStackLink"
            class="shrink-0 w-12 h-12 bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors cursor-pointer inline-flex items-center justify-center"
            :aria-label="copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy stack link'"
            :title="copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy stack link'">
            <svg v-if="copyStatus === 'idle'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <svg v-else-if="copyStatus === 'copied'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

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

          <button v-if="!renaming" type="button" @click="handleCreate"
            class="shrink-0 w-12 h-12 bg-white border-2 border-gray-900 text-gray-900 hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors cursor-pointer inline-flex items-center justify-center"
            aria-label="Create new stack">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        </template>
      </StackToolbar>

      <ToolSearchCombobox
        v-if="!creating && !renaming"
        :query="search.query.value"
        :is-open="search.isOpen.value"
        :filtered-groups="search.filteredGroups.value"
        :filtered-flat="search.filteredFlat.value"
        :is-highlighted="search.isHighlighted"
        @update:query="search.query.value = $event"
        @open="search.open"
        @close="search.close"
        @keydown="onSearchKeydown"
        @pick="pickTool"
        @mouseenter="search.highlightIndex.value = $event"
      />

      <div v-if="showDeleteConfirm" class="flex items-center gap-4 mb-3 p-4 bg-red-50 border-2 border-red-600">
        <span class="font-bold text-red-800">Delete this stack?</span>
        <button type="button" @click="handleDelete"
          class="px-4 h-10 bg-red-600 text-white font-black hover:bg-red-700 transition-colors cursor-pointer border-none">Delete</button>
        <button type="button" @click="showDeleteConfirm = false"
          class="px-4 h-10 bg-white border-2 border-gray-900 text-gray-900 font-black hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
      </div>

      <div v-if="stackTools.length === 0"
        class="py-16 text-center bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500 font-bold text-lg">
        Start with an inference engine, chat interface, document tool, or vector database.
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <StackCurrent :grouped-stack="groupedStack" :stack-name="activeStack?.name" @remove="removeToolFromStack" />
        <StackSuggestions :tools="suggestions" @add="addToolToStack" />
      </div>
    </template>
  </section>
</template>
