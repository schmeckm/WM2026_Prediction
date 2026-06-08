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
import { computed, onMounted, provide, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Sidebar from '../components/Sidebar.vue';
import Navbar from '../components/Navbar.vue';
import BottomNav from '../components/BottomNav.vue';
import SystemStatusBar from '../components/SystemStatusBar.vue';
import { useNotificationStore } from '../stores/notificationStore';
import { useAppSettingsStore } from '../stores/appSettingsStore';
import { useAdminNavLinks } from '../composables/useAdminNav';

const { t } = useI18n();
const notificationStore = useNotificationStore();
const appSettings = useAppSettingsStore();
const adminLinks = useAdminNavLinks();
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

const userLinks = computed(() => {
  const links = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: 'home' },
    { to: '/matches', label: t('nav.matches'), icon: 'matches' },
    { to: '/group-standings', label: t('nav.groupStandings'), icon: 'table' },
    { to: '/national-teams', label: t('nav.nationalTeams'), icon: 'globe' },
    { to: '/my-predictions', label: t('nav.myPredictions'), icon: 'edit' },
    { to: '/bonus', label: t('nav.bonus'), icon: 'target' },
    { to: '/ai-coach', label: t('nav.aiCoach'), icon: 'bot' },
    { to: '/leaderboard', label: t('nav.leaderboard'), icon: 'trophy' },
  ];

  if (appSettings.showPrizesNav) {
    links.push({ to: '/prizes', label: t('nav.prizes'), icon: 'award' });
  }

  links.push(
    { to: '/team-ranking', label: t('nav.teamRanking'), icon: 'users' },
    { to: '/statistics', label: t('nav.statistics'), icon: 'chart' },
    { to: '/notifications', label: t('nav.notifications'), icon: 'bell' },
    { to: '/profile', label: t('nav.profile'), icon: 'user' },
  );

  return links;
});
</script>
