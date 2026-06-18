<template>
  <aside class="sidebar" :class="{ open: isOpen }">
    <div class="sidebar-brand">
      <AppBrandMark compact />
    </div>
    <div class="sidebar-scroll">
      <nav class="sidebar-nav" :aria-label="adminMode ? t('nav.administration') : t('nav.navigation')">
        <template v-if="!adminMode">
          <template v-for="section in navSections" :key="section.label">
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
        </template>
        <template v-else>
          <router-link
            v-for="link in links"
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

        <template v-if="!adminMode && authStore.isAdmin && adminLinks">
          <div class="sidebar-section">{{ t('nav.administration') }}</div>
          <router-link
            v-for="link in adminLinks"
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
      <div v-if="!adminMode" class="sidebar-footer-links">
        <router-link to="/help" class="sidebar-link" active-class="active" @click="close">
          <span class="icon"><NavIcon name="help" /></span>
          {{ t('help.nav') }}
        </router-link>
      </div>
    </div>
    <div class="sidebar-footer">
      <div class="sidebar-footer-name">{{ authStore.fullName }}</div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/authStore';
import AppBrandMark from './AppBrandMark.vue';
import NavIcon from './NavIcon.vue';

defineProps({
  links: { type: Array, default: () => [] },
  navSections: { type: Array, default: () => [] },
  adminLinks: { type: Array, default: () => [] },
  adminMode: { type: Boolean, default: false },
});

const { t } = useI18n();
const authStore = useAuthStore();
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
