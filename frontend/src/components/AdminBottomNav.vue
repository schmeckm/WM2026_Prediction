<template>
  <nav class="bottom-nav admin-bottom-nav" :aria-label="t('nav.administration')">
    <router-link
      v-for="item in primaryItems"
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
import { computed, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import NavIcon from './NavIcon.vue';
import { useAdminNavLinks } from '../composables/useAdminNav';

const { t } = useI18n();
const route = useRoute();
const toggleSidebar = inject('toggleSidebar', () => {});
const adminLinks = useAdminNavLinks();

const primaryItems = computed(() => adminLinks.value.slice(0, 4));

function isActive(path) {
  if (path === '/admin') return route.path === '/admin';
  return route.path === path || route.path.startsWith(`${path}/`);
}

function openMenu() {
  toggleSidebar();
}
</script>

<style scoped>
.admin-bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .admin-bottom-nav {
    display: flex;
  }
}

.bottom-nav-more {
  border: none;
  background: none;
  font-family: inherit;
  cursor: pointer;
}
</style>
