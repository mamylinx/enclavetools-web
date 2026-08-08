<script setup lang="ts">
import { ref, onMounted } from 'vue';
import categories from '../data/categories.json';

interface NavItem {
  title: string;
  category: string;
  href: string;
}

const props = defineProps<{
  filter?: string;
}>();

const navRef = ref<HTMLElement | null>(null);
const showRightFade = ref(true);
const showBottomSheet = ref(false);
const activeFilter = ref(props.filter || '');

onMounted(() => {
  if (!props.filter) {
    const path = window.location.pathname;
    if (path.startsWith('/') && path !== '/' && !path.startsWith('/tools/') && !path.startsWith('/saved') && !path.startsWith('/privacy') && !path.startsWith('/terms')) {
      const category = path.replace(/^\//, '').split('/')[0];
      if (category) activeFilter.value = category;
    } 
  }
});

const navItems: NavItem[] = [
  ...categories.map((cat) => ({
    title: cat.title,
    category: cat.category,
    href: `/${cat.category}`,
  })),
];

const checkScroll = () => {
  if (!navRef.value) return;
  const nav = navRef.value;
  showRightFade.value = nav.scrollLeft < nav.scrollWidth - nav.clientWidth - 5;
};

const scrollRight = () => {
  navRef.value?.scrollBy({ left: 200, behavior: 'smooth' });
};

const toggleBottomSheet = () => {
  showBottomSheet.value = !showBottomSheet.value;
};

const closeBottomSheet = () => {
  showBottomSheet.value = false;
};
</script>

<template>
  <div class="sticky top-16 relative w-full max-w-[1400px] mx-auto px-4 flex sm:hidden items-center justify-between border-b border-brand-forest/5 bg-white/90 backdrop-blur-sm z-20">
    <nav ref="navRef" class="flex items-center gap-2 overflow-x-auto whitespace-nowrap py-4 flex-1 scrollbar-hide" tabindex="-1" @scroll="checkScroll">
      <a v-for="(item, i) in navItems" :key="item.category" class="px-4 py-2 text-sm font-bold border no-underline transition-all duration-300 ease-out-expo rounded-full"
        :class="activeFilter === item.category ? 'bg-gradient-cool text-white border-transparent shadow-sm shadow-accent-green/20' : 'bg-white/90 text-brand-muted border-brand-forest/5 hover:text-accent-teal hover:border-accent-teal/20 hover:-translate-y-0.5'" :href="item.href">
        {{ item.title }}
      </a>
    </nav>

    <div class="absolute right-10 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none transition-opacity duration-200 hidden md:flex items-center justify-end z-10" :class="showRightFade ? 'opacity-100' : 'opacity-0'" @click="scrollRight">
    </div>

    <button class="md:hidden ml-4 p-2 text-brand-muted bg-white border border-brand-forest/10 flex items-center justify-center cursor-pointer hover:bg-brand-teal hover:text-white hover:border-brand-teal transition-colors rounded-full" @click="toggleBottomSheet" aria-label="Show all categories">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <div class="fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300" :class="showBottomSheet ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'" @click="closeBottomSheet"></div>

    <div class="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur-md border-t border-brand-forest/5 z-[70] transition-transform duration-300 max-h-[85vh] flex flex-col rounded-t-4xl shadow-xl shadow-brand-forest/10" :class="showBottomSheet ? 'translate-y-0' : 'translate-y-full'">
      <div class="flex items-center justify-between px-4 md:px-8 py-4 border-b border-brand-forest/10 shrink-0">
        <span class="text-lg font-extrabold text-brand-forest tracking-tight">All Categories</span>
        <button class="flex items-center justify-center p-2 bg-transparent border border-transparent text-brand-muted hover:text-brand-forest transition-colors cursor-pointer" @click="closeBottomSheet" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <div class="overflow-y-auto px-4 md:px-8 py-4 flex-1 overscroll-contain">
        <a v-for="item in navItems" :key="item.category" class="flex items-center px-4 py-4 border-b border-brand-forest/10 text-base font-bold no-underline"
          :class="activeFilter === item.category ? 'text-brand-teal' : 'text-brand-muted'" :href="item.href" @click="closeBottomSheet">
          <span>{{ item.title }}</span>
        </a>
      </div>
    </div>
  </div>
</template>
