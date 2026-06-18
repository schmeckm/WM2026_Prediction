<template>
  <div class="layout-app" data-area="app">
    <a href="#main-content" class="skip-to-content">{{ t('common.skipToContent') }}</a>
    <div v-if="sidebarOpen" class="sidebar-backdrop" aria-hidden="true" @click="closeSidebar" />
    <Sidebar ref="sidebarRef" :nav-sections="adminNavSections" admin-mode />
    <div class="layout-main">
      <Navbar admin-mode @toggle-sidebar="toggleSidebar" />
      <main id="main-content" class="layout-content">
        <LoginAnnouncementModal />
        <router-view />
      </main>
      <SystemStatusBar />
      <AdminBottomNav />
    </div>
  </div>
</template>

<script setup>
import { onMounted, provide, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/authStore';
import Sidebar from '../components/Sidebar.vue';
import Navbar from '../components/Navbar.vue';
import SystemStatusBar from '../components/SystemStatusBar.vue';
import AdminBottomNav from '../components/AdminBottomNav.vue';
import LoginAnnouncementModal from '../components/LoginAnnouncementModal.vue';
import { useAdminNavSections } from '../composables/useAdminNav';
import { useNotificationStore } from '../stores/notificationStore';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const adminNavSections = useAdminNavSections();
const sidebarRef = ref(null);
const sidebarOpen = ref(false);

onMounted(async () => {
  notificationStore.initSocketListener();
  await notificationStore.fetchNotifications();
  try {
    await authStore.fetchMe();
  } catch {
    return;
  }
  if (!authStore.isAdmin) {
    router.replace('/dashboard');
  }
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
