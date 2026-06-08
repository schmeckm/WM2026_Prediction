<template>
  <div>
    <div class="page-header">
      <h1>{{ t('notifications.title') }}</h1>
      <button class="btn btn-secondary btn-sm" @click="store.markAllAsRead()">{{ t('notifications.markAllReadLong') }}</button>
    </div>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="loadNotifications" />

    <div v-else class="card"><div class="card-body"><NotificationList /></div></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '../stores/notificationStore';
import NotificationList from '../components/NotificationList.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ErrorState from '../components/ErrorState.vue';

const { t } = useI18n();
const store = useNotificationStore();
const loading = ref(true);
const error = ref('');

async function loadNotifications() {
  loading.value = true;
  error.value = '';
  try {
    await store.fetchNotifications();
  } catch (err) {
    error.value = err.response?.data?.error || t('notifications.loadFailed');
  } finally {
    loading.value = false;
  }
}

onMounted(loadNotifications);
</script>

<style scoped>
:deep(.notification-list) { max-height: none; }
:deep(.notification-item) { padding: 1rem; }
</style>
