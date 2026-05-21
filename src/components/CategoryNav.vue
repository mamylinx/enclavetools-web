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
    } else if (path === '/' || path === '') {
      activeFilter.value = 'all';
    }
  }
});

const navItems: NavItem[] = [
  { title: 'All', category: 'all', href: '/' },
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
  <div class="category-nav-container">
    <nav ref="navRef" class="category-nav" tabindex="-1" @scroll="checkScroll">
      <a
        v-for="item in navItems"
        :key="item.category"
        class="category-nav-item"
        :class="{ active: activeFilter === item.category }"
        :href="item.href"
      >
        {{ item.title }}
      </a>
    </nav>

    <div
      class="nav-fade nav-fade-right"
      :class="{ show: showRightFade }"
      @click="scrollRight"
    >
      <svg class="nav-arrow-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="m8 20 8-8-8-8" />
      </svg>
    </div>

    <button class="mobile-caret-btn" @click="toggleBottomSheet" aria-label="Show all categories">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <div class="bottom-sheet-overlay" :class="{ show: showBottomSheet }" @click="closeBottomSheet"></div>

    <div class="bottom-sheet-wrapper" :class="{ show: showBottomSheet }">
      <div class="bottom-sheet-header">
        <span class="bottom-sheet-title">All Categories</span>
        <button class="bottom-sheet-close" @click="closeBottomSheet" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <div class="bottom-sheet-content">
        <a
          v-for="item in navItems"
          :key="item.category"
          class="bottom-sheet-item"
          :class="{ active: activeFilter === item.category }"
          :href="item.href"
          @click="closeBottomSheet"
        >
          <span>{{ item.title }}</span>
        </a>
      </div>
    </div>
  </div>
</template>
