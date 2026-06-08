<template>
  <nav class="bottom-nav" :aria-label="t('nav.menu')">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="bottom-nav-link"
      :class="{ active: isActive(item.to) }"
    >
      <NavIcon :name="item.icon" size="lg" />
      <span>{{ item.label }}</span>
    </router-link>
    <button
      type="button"
      class="bottom-nav-link bottom-nav-more"
      :aria-label="t('nav.menuMore')"
      @click="openMenu"
    >
      <NavIcon name="menu" size="lg" />
      <span>{{ t('nav.menuMore') }}</span>
    </button>
  </nav>
</template>

<script setup>
import { inject } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import NavIcon from './NavIcon.vue';
import { useBottomNavLinks } from '../composables/useUserNav';

const { t } = useI18n();
const route = useRoute();
const toggleSidebar = inject('toggleSidebar', () => {});
const items = useBottomNavLinks();

function isActive(path) {
  return route.path === path || route.path.startsWith(`${path}/`);
}

function openMenu() {
  toggleSidebar();
}
</script>

<style scoped>
.bottom-nav-more {
  border: none;
  background: none;
  font-family: inherit;
  cursor: pointer;
}
</style>
