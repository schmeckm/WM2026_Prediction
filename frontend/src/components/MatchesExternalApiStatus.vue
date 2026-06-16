<template>
  <div v-if="items.length" class="matches-api-status" role="status" :aria-label="t('matches.apiStatus.title')">
    <span class="matches-api-status__label">{{ t('matches.apiStatus.title') }}</span>
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="matches-api-status__pill"
      :class="`matches-api-status__pill--${item.state}`"
      :title="item.detail || item.label"
      @click="toggle(item.id)"
    >
      <span class="matches-api-status__dot" aria-hidden="true" />
      {{ item.label }}: {{ item.text }}
    </button>
    <p v-if="expandedDetail" class="matches-api-status__detail text-muted">{{ expandedDetail }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const externalApis = ref([]);
const expandedId = ref(null);
let timer = null;

const LABEL_KEYS = {
  football: 'systemHealth.externalFootball',
  odds: 'systemHealth.externalOdds',
};

function mapState(api) {
  if (!api.enabled) return 'inactive';
  if (!api.configured) return 'inactive';
  if (api.active) return 'online';
  return 'offline';
}

function stateText(state) {
  if (state === 'online') return t('systemHealth.online');
  if (state === 'inactive') return t('systemHealth.inactive');
  return t('systemHealth.offline');
}

function reasonDetail(api) {
  if (api.reason === 'not_configured') {
    if (api.id === 'football') return t('systemHealth.detailFootballNotConfigured');
    if (api.id === 'odds') return t('systemHealth.detailOddsNotConfigured');
  }
  if (api.id === 'odds' && api.active && api.quotaRemaining != null) {
    return t('systemHealth.detailOddsQuota', { remaining: api.quotaRemaining });
  }
  if (api.reason === 'unreachable') return api.detail || t('systemHealth.detailExternalUnreachable');
  if (api.detail === 'sport_inactive') return t('systemHealth.detailOddsSportInactive');
  return api.detail || '';
}

const items = computed(() => externalApis.value
  .filter((api) => api.id === 'football' || api.id === 'odds')
  .map((api) => {
    const state = mapState(api);
    return {
      id: api.id,
      label: t(LABEL_KEYS[api.id] || 'systemHealth.externalApi'),
      state,
      text: stateText(state),
      detail: reasonDetail(api),
    };
  }));

const expandedDetail = computed(() => {
  const item = items.value.find((entry) => entry.id === expandedId.value);
  return item?.detail || '';
});

function toggle(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

async function refresh() {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) return;
    const data = await response.json();
    externalApis.value = Array.isArray(data.externalApis) ? data.externalApis : [];
  } catch {
    externalApis.value = [];
  }
}

onMounted(() => {
  refresh();
  timer = setInterval(refresh, 60000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.matches-api-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
}

.matches-api-status__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.matches-api-status__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  background: var(--color-surface);
  font-size: 0.8rem;
  cursor: pointer;
}

.matches-api-status__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: currentColor;
}

.matches-api-status__pill--online { color: var(--color-success); }
.matches-api-status__pill--offline { color: var(--color-danger); }
.matches-api-status__pill--inactive { color: var(--color-text-muted); }

.matches-api-status__detail {
  flex-basis: 100%;
  margin: 0;
  font-size: 0.82rem;
}
</style>
