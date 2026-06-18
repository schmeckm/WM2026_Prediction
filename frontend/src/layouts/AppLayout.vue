<template>
  <div class="layout-app" data-area="app">
    <a href="#main-content" class="skip-to-content">{{ t('common.skipToContent') }}</a>
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="closeSidebar" />
    <Sidebar ref="sidebarRef" :nav-sections="userLinks" :admin-nav-sections="adminNavSections" />
    <div class="layout-main">
      <Navbar @toggle-sidebar="toggleSidebar" />
      <main id="main-content" class="layout-content">
    <ProfileCompletionBanner />
    <PwaInstallBanner />
    <LoginAnnouncementModal />
    <router-view />
      </main>
      <SystemStatusBar />
      <BottomNav />
    </div>
  </div>
</template>

<script setup>
import { onMounted, provide, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Sidebar from '../components/Sidebar.vue';
import Navbar from '../components/Navbar.vue';
import BottomNav from '../components/BottomNav.vue';
import SystemStatusBar from '../components/SystemStatusBar.vue';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner.vue';
import PwaInstallBanner from '../components/PwaInstallBanner.vue';
import LoginAnnouncementModal from '../components/LoginAnnouncementModal.vue';
import { useNotificationStore } from '../stores/notificationStore';
import { useAppSettingsStore } from '../stores/appSettingsStore';
import { useAuthStore } from '../stores/authStore';
import { useAdminNavSections } from '../composables/useAdminNav';
import { useUserNavLinks } from '../composables/useUserNav';
import { useProfileCompletion } from '../composables/useProfileCompletion';
import { useToast } from '../composables/useToast';

const { t } = useI18n();
const authStore = useAuthStore();
const { needsCompletion } = useProfileCompletion();
const toast = useToast();
const notificationStore = useNotificationStore();
const appSettings = useAppSettingsStore();
const adminNavSections = useAdminNavSections();
const userLinks = useUserNavLinks();
const sidebarRef = ref(null);
const sidebarOpen = ref(false);

function showProfileLoginReminder() {
  if (!authStore.profileLoginReminderDue || !needsCompletion.value) return;
  toast.warning(t('profile.completionReminder'));
  authStore.profileLoginReminderDue = false;
}

onMounted(async () => {
  notificationStore.initSocketListener();
  await notificationStore.fetchNotifications();
  appSettings.load();
  showProfileLoginReminder();
});

watch(
  () => [authStore.profileLoginReminderDue, needsCompletion.value],
  () => showProfileLoginReminder(),
);

function toggleSidebar() {
  sidebarOpen.value = sidebarRef.value?.toggle() ?? false;
}

function closeSidebar() {
  sidebarOpen.value = false;
  sidebarRef.value?.close();
}

provide('toggleSidebar', toggleSidebar);
</script>
