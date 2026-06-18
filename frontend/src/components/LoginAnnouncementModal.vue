<template>
  <Teleport to="body">
    <div v-if="current" class="modal-overlay" @click.self="dismiss">
      <div
        class="modal login-announcement-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div class="modal-header">
          <h3 :id="titleId">{{ current.title }}</h3>
          <button
            type="button"
            class="modal-close"
            :aria-label="t('common.close')"
            @click="dismiss"
          >
            &times;
          </button>
        </div>
        <div class="modal-body">
          <p class="announcement-message">{{ current.message }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="dismiss">
            {{ t('loginAnnouncement.dismiss') }}
          </button>
          <button
            v-if="current.link"
            type="button"
            class="btn btn-primary"
            @click="openLink"
          >
            {{ t('loginAnnouncement.openLink') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '../stores/notificationStore';

const { t } = useI18n();
const router = useRouter();
const store = useNotificationStore();
const queue = ref([]);
const titleId = `login-announcement-title-${Math.random().toString(36).slice(2, 9)}`;

const current = computed(() => queue.value[0] || null);

function refreshQueue() {
  queue.value = store.notifications.filter((item) => item.showOnLogin && !item.isRead);
}

watch(
  () => store.notifications,
  () => refreshQueue(),
  { deep: true, immediate: true },
);

async function dismiss() {
  const item = current.value;
  if (!item) return;
  await store.markAsRead(item.id);
  queue.value = queue.value.filter((entry) => entry.id !== item.id);
}

async function openLink() {
  const item = current.value;
  if (!item) return;
  const link = item.link;
  await dismiss();
  if (link) router.push(link);
}

defineExpose({ refreshQueue });
</script>

<style scoped>
.login-announcement-modal {
  max-width: 520px;
}

.announcement-message {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>
