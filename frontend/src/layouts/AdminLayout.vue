<template>
  <div class="layout-app" data-area="app">
    <a href="#main-content" class="skip-to-content">{{ t('common.skipToContent') }}</a>
    <div v-if="sidebarOpen" class="sidebar-backdrop" aria-hidden="true" @click="closeSidebar" />
    <Sidebar ref="sidebarRef" :links="adminSidebarLinks" admin-mode />
    <div class="layout-main">
      <Navbar admin-mode @toggle-sidebar="toggleSidebar" />
      <main id="main-content" class="layout-content">
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
import { useAdminSidebarLinks } from '../composables/useAdminNav';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const adminSidebarLinks = useAdminSidebarLinks();
const sidebarRef = ref(null);
const sidebarOpen = ref(false);

onMounted(async () => {
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
