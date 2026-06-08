<template>
  <div class="sync-log-table">
    <div class="table-wrapper sync-log-desktop">
      <table>
        <thead>
          <tr>
            <th>{{ t('adminPages.sync.logType') }}</th>
            <th>{{ t('adminPages.sync.logStatus') }}</th>
            <th>{{ t('adminPages.sync.logProvider') }}</th>
            <th>{{ t('adminPages.sync.logStarted') }}</th>
            <th>{{ t('adminPages.sync.logCreated') }}</th>
            <th>{{ t('adminPages.sync.logUpdated') }}</th>
            <th>{{ t('adminPages.sync.logSkipped') }}</th>
            <th>{{ t('adminPages.sync.logErrors') }}</th>
            <th>{{ t('adminPages.sync.logMessage') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ log.syncType }}</td>
            <td><span :class="['badge', statusClass(log.status)]">{{ log.status }}</span></td>
            <td>{{ log.provider || '–' }}</td>
            <td>{{ formatDate(log.startedAt) }}</td>
            <td>{{ log.createdCount }}</td>
            <td>{{ log.updatedCount }}</td>
            <td>{{ log.skippedCount }}</td>
            <td>{{ log.errorCount }}</td>
            <td class="error-cell">{{ log.errorMessage || '–' }}</td>
          </tr>
          <tr v-if="logs.length === 0">
            <td colspan="9" class="text-center text-muted">{{ t('adminPages.sync.noLogs') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="sync-log-mobile">
      <article v-for="log in logs" :key="`mobile-${log.id}`" class="sync-log-card">
        <div class="sync-log-card-header">
          <strong>{{ log.syncType }}</strong>
          <span :class="['badge', statusClass(log.status)]">{{ log.status }}</span>
        </div>
        <dl class="sync-log-card-fields">
          <dt>{{ t('adminPages.sync.logStarted') }}</dt><dd>{{ formatDate(log.startedAt) }}</dd>
          <dt>{{ t('adminPages.sync.logCreated') }}</dt><dd>{{ log.createdCount }}</dd>
          <dt>{{ t('adminPages.sync.logUpdated') }}</dt><dd>{{ log.updatedCount }}</dd>
          <dt>{{ t('adminPages.sync.logSkipped') }}</dt><dd>{{ log.skippedCount }}</dd>
          <dt>{{ t('adminPages.sync.logErrors') }}</dt><dd>{{ log.errorCount }}</dd>
        </dl>
        <p v-if="log.errorMessage" class="error-cell">{{ log.errorMessage }}</p>
      </article>
      <p v-if="logs.length === 0" class="text-center text-muted">{{ t('adminPages.sync.noLogs') }}</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({ logs: { type: Array, default: () => [] } });

const { t, locale } = useI18n();

function formatDate(d) {
  return new Date(d).toLocaleString(locale.value);
}

function statusClass(s) {
  return {
    success: 'badge-success',
    failed: 'badge-danger',
    partial: 'badge-warning',
    running: 'badge-info',
  }[s] || 'badge-info';
}
</script>

<style scoped>
.error-cell {
  max-width: 220px;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.sync-log-mobile {
  display: none;
}

.sync-log-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.875rem;
  background: var(--color-surface);
}

.sync-log-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.sync-log-card-fields {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.75rem;
  margin: 0;
}

.sync-log-card-fields dt {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.sync-log-card-fields dd {
  margin: 0;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .sync-log-desktop {
    display: none;
  }

  .sync-log-mobile {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
