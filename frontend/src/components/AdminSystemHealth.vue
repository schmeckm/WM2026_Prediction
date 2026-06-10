<template>
  <div class="card">
    <div class="card-header"><h3>{{ t('adminPages.system.healthTitle') }}</h3></div>
    <div class="card-body">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ health.version }}</div>
          <div class="stat-label">{{ t('adminPages.system.version') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ health.database?.status === 'ok' ? '✓' : '✗' }}</div>
          <div class="stat-label">
            {{ t('adminPages.system.database') }} ({{ health.database?.dialect }})
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ health.websocket?.active ? '✓' : '✗' }}</div>
          <div class="stat-label">{{ t('adminPages.system.websocket') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ health.email?.configured ? '✓' : '✗' }}</div>
          <div class="stat-label">{{ t('adminPages.system.email') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ health.api?.configured ? '✓' : '✗' }}</div>
          <div class="stat-label">{{ t('adminPages.system.footballApi') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatUptime(health.uptime) }}</div>
          <div class="stat-label">{{ t('adminPages.system.uptime') }}</div>
        </div>
      </div>

      <p v-if="health.api?.statusMessage" class="api-status-message">{{ health.api.statusMessage }}</p>

      <div v-if="lastSyncInfo" class="sync-summary mt-2">
        <strong>{{ t('adminPages.system.lastSyncTitle') }}</strong>
        <span>{{ lastSyncInfo }}</span>
      </div>

      <div v-if="health.lastError" class="alert alert-error mt-2">
        <strong>{{ t('adminPages.system.lastSyncErrorTitle') }}</strong>
        <div>{{ syncErrorLine }}</div>
        <div v-if="syncErrorHint" class="sync-error-hint">{{ syncErrorHint }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({ health: { type: Object, default: () => ({}) } });
const { t, locale } = useI18n();

const SYNC_TYPE_KEYS = {
  fixtures: 'adminPages.system.syncTypeFixtures',
  results: 'adminPages.system.syncTypeResults',
  live_scores: 'adminPages.system.syncTypeLiveScores',
  player_images: 'adminPages.system.syncTypePlayerImages',
};

function formatUptime(seconds) {
  if (!seconds) return '–';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatDate(value) {
  if (!value) return '–';
  return new Date(value).toLocaleString(locale.value);
}

const lastSyncInfo = computed(() => {
  const fixture = props.health.api?.lastSuccessfulFixture?.finishedAt
    || props.health.api?.lastFixtureSync?.finishedAt;
  const result = props.health.api?.lastSuccessfulResult?.finishedAt
    || props.health.api?.lastResultSync?.finishedAt;

  if (!fixture && !result) return '';

  const parts = [];
  if (fixture) {
    parts.push(t('adminPages.system.lastFixtureSync', { time: formatDate(fixture) }));
  }
  if (result) {
    parts.push(t('adminPages.system.lastResultSync', { time: formatDate(result) }));
  }
  return parts.join(' · ');
});

const syncErrorLine = computed(() => {
  const err = props.health.lastError;
  if (!err) return '';
  const typeLabel = t(SYNC_TYPE_KEYS[err.syncType] || 'adminPages.system.syncTypeUnknown');
  return t('adminPages.system.lastSyncErrorLine', {
    type: typeLabel,
    time: formatDate(err.startedAt),
    message: err.errorMessage,
  });
});

const syncErrorHint = computed(() => {
  const message = props.health.lastError?.errorMessage || '';
  if (message === 'fetch failed' || message.includes('fetch failed')) {
    return t('adminPages.system.syncErrorFetchFailedHint');
  }
  if (message.includes('aborted') || message.includes('Timeout')) {
    return t('adminPages.system.syncErrorTimeoutHint');
  }
  return '';
});
</script>

<style scoped>
.api-status-message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 193, 7, 0.1);
  border-left: 3px solid var(--color-accent-dark);
  font-size: 0.875rem;
  border-radius: var(--radius-sm);
}
.sync-summary {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.sync-summary strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--color-text);
}
.sync-error-hint {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  opacity: 0.9;
}
.mt-2 { margin-top: 1rem; }
</style>
