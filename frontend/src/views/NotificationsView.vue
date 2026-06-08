<template>
  <div>
    <div class="page-header">
      <h1>{{ t('notifications.title') }}</h1>
      <button class="btn btn-secondary btn-sm" @click="store.markAllAsRead()">{{ t('notifications.markAllReadLong') }}</button>
    </div>

    <LoadingSpinner v-if="loading" />
    <AlertMessage v-else-if="error" :message="error" type="error" />

    <div v-else class="card"><div class="card-body"><NotificationList /></div></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '../stores/notificationStore';
import NotificationList from '../components/NotificationList.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import AlertMessage from '../components/AlertMessage.vue';

const { t } = useI18n();
const store = useNotificationStore();
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    await store.fetchNotifications();
  } catch (err) {
    error.value = err.response?.data?.error || t('notifications.loadFailed');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
:deep(.notification-list) { max-height: none; }
:deep(.notification-item) { padding: 1rem; }
</style>
