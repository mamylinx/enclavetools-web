<script setup lang="ts">
import type { StoredStack } from '../../utils/stacks';

defineProps<{
  stacks: StoredStack[];
  activeId: string;
  activeStack?: StoredStack;
  creating: boolean;
  renaming: boolean;
  createDraft: string;
  renameDraft: string;
}>();

const emit = defineEmits<{
  'update:createDraft': [value: string];
  'update:renameDraft': [value: string];
  switch: [id: string];
  delete: [];
  submitCreate: [];
  submitRename: [];
  startCreate: [];
  cancelCreate: [];
  startRename: [];
  cancelRename: [];
}>();
</script>

<template>
  <div class="mb-3 p-4 bg-brand-bg border border-brand-forest/10 rounded-2xl">
    <!-- Create form -->
    <div v-if="creating" class="flex flex-col md:flex-row items-center gap-3 w-full">
      <input id="ci" type="text" :value="createDraft"
        @input="$emit('update:createDraft', ($event.target as HTMLInputElement).value)"
        @keydown.enter="$emit('submitCreate')" @keydown.escape="$emit('cancelCreate')" placeholder="Name the new stack"
        class="flex-1 w-full bg-white border border-brand-forest/10 px-4 h-12 font-bold text-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-teal rounded-full"
        maxlength="30" />
      <div class="flex gap-2 w-full md:w-auto">
        <button type="button" @click="$emit('submitCreate')"
          class="px-4 h-12 bg-brand-forest text-white font-extrabold hover:bg-brand-teal transition-colors cursor-pointer border-none rounded-full">Create</button>
        <button type="button" @click="$emit('cancelCreate')"
          class="px-4 h-12 bg-white border border-brand-forest/10 text-brand-forest font-extrabold hover:bg-brand-bg transition-colors cursor-pointer rounded-full">Cancel</button>
      </div>
    </div>

    <!-- Rename form: full width below toolbar -->
    <div v-else-if="renaming" class="flex flex-col gap-3 w-full">
      <input id="ri" type="text" :value="renameDraft"
        @input="$emit('update:renameDraft', ($event.target as HTMLInputElement).value)"
        @keydown.enter="$emit('submitRename')" @keydown.escape="$emit('cancelRename')" placeholder="New stack name"
        class="w-full bg-white border border-brand-forest/10 px-3 h-12 font-bold text-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-teal rounded-full"
        maxlength="30" />
      <div class="flex gap-2 w-full">
        <button type="button" @click="$emit('submitRename')"
          class="flex-1 px-4 h-12 bg-brand-forest text-white font-extrabold hover:bg-brand-teal transition-colors cursor-pointer border-none text-sm rounded-full">Save</button>
        <button type="button" @click="$emit('cancelRename')"
          class="flex-1 px-4 h-12 bg-white border border-brand-forest/10 text-brand-forest font-extrabold hover:bg-brand-bg transition-colors cursor-pointer text-sm rounded-full">Cancel</button>
      </div>
    </div>

    <!-- Normal toolbar -->
    <div v-else class="flex flex-col md:flex-row items-center gap-3 w-full">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div v-if="stacks.length === 1"
          class="flex flex-1 items-center h-12 px-3 bg-white border border-brand-forest/10 min-w-[160px] font-bold text-brand-forest gap-2 truncate rounded-full">
          <span class="truncate">{{ activeStack?.name }}</span>
          <span class="shrink-0 text-brand-muted text-sm">({{ activeStack?.tools.length || 0 }})</span>
        </div>
        <select v-else
          class="flex-1 bg-white border border-brand-forest/10 px-3 h-12 font-bold text-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-teal cursor-pointer min-w-[160px] rounded-full"
          :value="activeId" @change="$emit('switch', ($event.target as HTMLSelectElement).value)"
          aria-label="Select stack">
          <option v-for="s in stacks" :key="s.id" :value="s.id">{{ s.name }} ({{ s.tools.length }})</option>
        </select>

        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
