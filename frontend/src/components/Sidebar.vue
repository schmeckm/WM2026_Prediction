<template>
  <aside class="sidebar" :class="{ open: isOpen }">
    <div class="sidebar-brand">
      <AppBrandMark compact show-subtitle />
    </div>
    <div class="sidebar-scroll">
      <nav class="sidebar-nav" :aria-label="adminMode ? t('nav.administration') : t('nav.navigation')">
        <template v-for="section in activeNavSections" :key="section.label">
          <div class="sidebar-section">{{ section.label }}</div>
          <router-link
            v-for="link in section.links"
            :key="link.to"
            :to="link.to"
            class="sidebar-link"
            active-class="active"
            @click="close"
          >
            <span class="icon"><NavIcon :name="link.icon" /></span>
            {{ link.label }}
          </router-link>
        </template>
      </nav>
      <div class="sidebar-footer-links">
        <router-link
          v-if="adminMode"
          to="/dashboard"
          class="sidebar-link"
          active-class="active"
          @click="close"
        >
          <span class="icon"><NavIcon name="arrow-left" /></span>
          {{ t('nav.backToApp') }}
        </router-link>
      </div>
    </div>
    <div class="sidebar-footer">
      <div class="sidebar-footer-name">{{ authStore.fullName }}</div>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/authStore';
import AppBrandMark from './AppBrandMark.vue';
import NavIcon from './NavIcon.vue';

const props = defineProps({
  navSections: { type: Array, default: () => [] },
  adminNavSections: { type: Array, default: () => [] },
  adminMode: { type: Boolean, default: false },
});

const authStore = useAuthStore();

const activeNavSections = computed(() => {
  if (props.adminMode) {
    return props.navSections;
  }

  const sections = [...props.navSections];
  if (authStore.isAdmin && props.adminNavSections.length) {
    sections.push(...props.adminNavSections);
  }
  return sections;
});

const { t } = useI18n();
const isOpen = ref(false);

function toggle() {
  isOpen.value = !isOpen.value;
  return isOpen.value;
}

function close() {
  isOpen.value = false;
}

defineExpose({ toggle, close, isOpen });
</script>
