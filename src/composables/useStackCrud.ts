import { ref, computed } from 'vue';
import {
  getAll, addTool, removeTool,
  rename as renameStack, remove as deleteStack,
  create as createStack, setActive,
  type StoredStack,
} from '../utils/stacks';

export function useStackCrud() {
  const stacks = ref<StoredStack[]>([]);
  const activeId = ref<string>('');

  const activeStack = computed(() =>
    stacks.value.find((s) => s.id === activeId.value),
  );

  function refresh() {
    stacks.value = getAll();
    if (!stacks.value.find((s) => s.id === activeId.value)) {
      activeId.value = stacks.value[0]?.id || '';
    }
  }

  function switchStack(id: string) {
    if (id === activeId.value) return;
    activeId.value = id;
    setActive(id);
  }

  function addToolToStack(slug?: string) {
    if (!slug || !activeId.value) return;
    addTool(activeId.value, slug);
    refresh();
  }

  function removeToolFromStack(slug?: string) {
    if (!slug || !activeId.value) return;
    removeTool(activeId.value, slug);
    refresh();
  }

  function deleteActiveStack() {
    if (!activeId.value) return;
    deleteStack(activeId.value);
    refresh();
  }

  function createNewStack(name: string): StoredStack {
    const s = createStack(name);
    activeId.value = s.id;
    refresh();
    return s;
  }

  function renameActiveStack(newName: string) {
    if (!activeId.value || !newName.trim()) return;
    renameStack(activeId.value, newName.trim());
    refresh();
  }

  return {
    stacks,
    activeId,
    activeStack,
    refresh,
    switchStack,
    addToolToStack,
    removeToolFromStack,
    deleteActiveStack,
    createNewStack,
    renameActiveStack,
  };
}
