<script setup lang="ts">
import type { ToolWithCategory } from '../utils/toolModel';
import { useStackBuilder } from '../composables/useStackBuilder';
import StackToolbar from './stack/StackToolbar.vue';
import ToolSearchCombobox from './stack/ToolSearchCombobox.vue';
import StackCurrent from './stack/StackCurrent.vue';
import StackSuggestions from './stack/StackSuggestions.vue';
import EmptyStateBanner from './stack/EmptyStateBanner.vue';
import DeleteConfirmBanner from './stack/DeleteConfirmBanner.vue';
import EmptyStackPrompt from './stack/EmptyStackPrompt.vue';

const props = defineProps<{ tools: ToolWithCategory[] }>();

const {
  stacks, activeId, activeStack, creating, renaming,
  showDeleteConfirm, showOverflow, createDraft, renameDraft,
  search, copyStatus, groupedStack, suggestions, stackTools,
  pickTool, onSearchKeydown, handleDelete, handleCreate,
  commitCreate, cancelCreate, startRename, commitRename, cancelRename,
  copyStackLink, addAllSuggestions,
  switchStack, removeToolFromStack, addToolToStack,
} = useStackBuilder(props);
</script>

<template>
  <section class="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
    <EmptyStateBanner v-if="stacks.length === 0 && !creating" @create="handleCreate" />

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
            class="shrink-0 w-12 h-12 bg-white/90 backdrop-blur-sm border border-brand-forest/5 text-brand-forest hover:bg-accent-teal hover:text-white hover:border-accent-teal hover:shadow-md transition-all cursor-pointer inline-flex items-center justify-center rounded-full"
            :aria-label="copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy stack link'"
            :title="copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy stack link'">
            <svg v-if="copyStatus === 'idle'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <svg v-else-if="copyStatus === 'copied'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          <div v-if="!renaming" id="ow" class="relative shrink-0">
            <button type="button" @click="showOverflow = !showOverflow"
              class="w-12 h-12 bg-white/90 backdrop-blur-sm border border-brand-forest/5 text-brand-forest hover:bg-accent-teal hover:text-white hover:border-accent-teal hover:shadow-md transition-all cursor-pointer inline-flex items-center justify-center rounded-full"
              aria-label="Stack actions">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <div v-if="showOverflow" class="absolute right-0 top-full mt-2 z-50 bg-white/98 backdrop-blur-md border border-brand-forest/5 shadow-lg shadow-brand-forest/10 min-w-[180px] rounded-2xl">
              <button type="button" @click="startRename" class="flex items-center gap-3 w-full text-left px-4 h-12 text-sm font-bold text-brand-forest hover:bg-accent-teal/5 hover:text-accent-teal border-b border-brand-forest/5 cursor-pointer bg-transparent transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                Rename
              </button>
              <button type="button" @click="showDeleteConfirm = true; showOverflow = false" class="flex items-center gap-3 w-full text-left px-4 h-12 text-sm font-bold text-accent-red hover:bg-accent-red/5 cursor-pointer bg-transparent transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Delete
              </button>
            </div>
          </div>

          <button v-if="!renaming" type="button" @click="handleCreate"
            class="shrink-0 w-12 h-12 bg-white/90 backdrop-blur-sm border border-brand-forest/5 text-brand-forest hover:bg-accent-teal hover:text-white hover:border-accent-teal hover:shadow-md transition-all cursor-pointer inline-flex items-center justify-center rounded-full"
            aria-label="Create new stack">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
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

      <DeleteConfirmBanner v-if="showDeleteConfirm" @delete="handleDelete" @cancel="showDeleteConfirm = false" />

      <EmptyStackPrompt v-if="stackTools.length === 0" />

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <StackCurrent :grouped-stack="groupedStack" :stack-name="activeStack?.name" @remove="removeToolFromStack" />
        <StackSuggestions :tools="suggestions" @add="addToolToStack" />
      </div>
    </template>
  </section>
</template>
