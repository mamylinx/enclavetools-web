import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { getWorksWith, type ToolWithCategory } from '../utils/toolModel';
import { create as createStack, setActive, addTool } from '../utils/stacks';
import { useStackCrud } from './useStackCrud';
import { useToolSearch } from './useToolSearch';
import { useClipboard } from './useClipboard';

export function useStackBuilder(props: { tools: ToolWithCategory[] }) {
  const {
    stacks, activeId, activeStack, refresh, switchStack,
    addToolToStack, removeToolFromStack, deleteActiveStack,
    createNewStack, renameActiveStack,
  } = useStackCrud();

  const allTools = computed(() => props.tools);

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
      ids.forEach((slug) => addTool(s.id, slug));
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

  return {
    stacks, activeId, activeStack, creating, renaming,
    showDeleteConfirm, showOverflow, createDraft, renameDraft,
    search, copyStatus, groupedStack, suggestions, stackTools,
    pickTool, onSearchKeydown, handleDelete, handleCreate,
    commitCreate, cancelCreate, startRename, commitRename, cancelRename,
    copyStackLink, addAllSuggestions, createNewStack,
    switchStack, removeToolFromStack, addToolToStack,
  };
}
