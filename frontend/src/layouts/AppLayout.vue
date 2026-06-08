<template>
  <div class="layout-app" data-area="app">
    <a href="#main-content" class="skip-to-content">{{ t('common.skipToContent') }}</a>
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="closeSidebar" />
    <Sidebar ref="sidebarRef" :links="userLinks" :admin-links="adminLinks" />
    <div class="layout-main">
      <Navbar @toggle-sidebar="toggleSidebar" />
      <main id="main-content" class="layout-content">
        <router-view />
      </main>
      <SystemStatusBar />
      <BottomNav />
    </div>
  </div>
</template>

<script setup>
import { onMounted, provide, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Sidebar from '../components/Sidebar.vue';
import Navbar from '../components/Navbar.vue';
import BottomNav from '../components/BottomNav.vue';
import SystemStatusBar from '../components/SystemStatusBar.vue';
import { useNotificationStore } from '../stores/notificationStore';
import { useAppSettingsStore } from '../stores/appSettingsStore';
import { useAdminNavLinks } from '../composables/useAdminNav';
import { useUserNavLinks } from '../composables/useUserNav';

const { t } = useI18n();
const notificationStore = useNotificationStore();
const appSettings = useAppSettingsStore();
const adminLinks = useAdminNavLinks();
const userLinks = useUserNavLinks();
const sidebarRef = ref(null);
const sidebarOpen = ref(false);

onMounted(() => {
  notificationStore.initSocketListener();
  appSettings.load();
});

function toggleSidebar() {
  sidebarOpen.value = sidebarRef.value?.toggle() ?? false;
}

function closeSidebar() {
  sidebarOpen.value = false;
  sidebarRef.value?.close();
}

provide('toggleSidebar', toggleSidebar);
</script>
