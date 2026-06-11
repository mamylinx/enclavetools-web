import { ref, computed, nextTick } from 'vue';
import { categoryValue, type ToolWithCategory } from '../utils/toolModel';

export function useToolSearch(
  allTools: () => ToolWithCategory[],
  excludedSlugs: () => Set<string>,
) {
  const query = ref('');
  const isOpen = ref(false);
  const highlightIndex = ref(-1);
  const inputEl = ref<HTMLInputElement | null>(null);
  const dropdownEl = ref<HTMLDivElement | null>(null);

  const filteredGroups = computed(() => {
    const q = query.value.trim().toLowerCase();
    const excluded = excludedSlugs();
    const source = q
      ? allTools().filter(
          (t) =>
            !excluded.has(t.slug || '') &&
            (t.title?.toLowerCase().includes(q) ||
              t.category?.toLowerCase().includes(q) ||
              t.body?.toLowerCase().includes(q)),
        )
      : allTools().filter((t) => !excluded.has(t.slug || ''));

    const groups = new Map<string, ToolWithCategory[]>();
    source.forEach((t) => {
      const cat = categoryValue(t) || 'Other';
      groups.set(cat, [...(groups.get(cat) || []), t]);
    });
    return Array.from(groups.entries());
  });

  const filteredFlat = computed(() =>
    filteredGroups.value.flatMap(([, tools]) => tools),
  );

  function open() {
    isOpen.value = true;
    highlightIndex.value = -1;
  }

  function close() {
    isOpen.value = false;
    query.value = '';
    highlightIndex.value = -1;
  }

  function onKeydown(e: KeyboardEvent): string | undefined {
    const flat = filteredFlat.value;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex.value = Math.min(highlightIndex.value + 1, flat.length - 1);
      scrollHighlightIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex.value = Math.max(highlightIndex.value - 1, 0);
      scrollHighlightIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex.value >= 0 && flat[highlightIndex.value]) {
        return flat[highlightIndex.value].slug;
      }
    } else if (e.key === 'Escape') {
      close();
    } else {
      highlightIndex.value = -1;
    }
    return undefined;
  }

  function scrollHighlightIntoView() {
    nextTick(() => {
      const el = dropdownEl.value?.querySelector('[data-highlighted="true"]');
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  function isHighlighted(slug: string | undefined): boolean {
    if (!slug) return false;
    return filteredFlat.value.findIndex((t) => t.slug === slug) === highlightIndex.value;
  }

  return {
    query,
    isOpen,
    highlightIndex,
    inputEl,
    dropdownEl,
    filteredGroups,
    filteredFlat,
    open,
    close,
    onKeydown,
    isHighlighted,
  };
}
