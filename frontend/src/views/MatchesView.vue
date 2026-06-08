<template>
  <div>
    <div class="page-header page-header--with-actions">
      <h1>{{ t('matches.title') }}</h1>
      <div class="view-toggle" role="group" :aria-label="t('matches.viewMode')">
        <button
          type="button"
          :class="['btn btn-sm', viewMode === 'cards' ? 'btn-primary' : 'btn-secondary']"
          :aria-pressed="viewMode === 'cards'"
          @click="setViewMode('cards')"
        >
          {{ t('matches.viewCards') }}
        </button>
        <button
          type="button"
          :class="['btn btn-sm', viewMode === 'table' ? 'btn-primary' : 'btn-secondary']"
          :aria-pressed="viewMode === 'table'"
          @click="setViewMode('table')"
        >
          {{ t('matches.viewTable') }}
        </button>
      </div>
    </div>

    <div v-if="lockWarning" class="alert alert-warning lock-warning" role="status">
      {{ lockWarning }}
    </div>

    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.value"
        :class="['filter-btn', { active: activeFilter === f.value }]"
        :aria-pressed="activeFilter === f.value"
        @click="setFilter(f.value)"
      >
        {{ f.label }}
      </button>
    </div>

    <div v-if="hasActiveFilters" class="alert alert-info filter-active-banner" role="status">
      <span>{{ filterActiveLabel }}</span>
      <button type="button" class="btn btn-secondary btn-sm" @click="resetFilters">
        {{ t('matches.filters.reset') }}
      </button>
    </div>

    <div class="group-filter-section">
      <span class="group-filter-label">{{ t('matches.filters.groupBy') }}</span>
      <div class="group-chip-bar" role="group" :aria-label="t('matches.filters.groupBy')">
        <button
          type="button"
          :class="['filter-btn group-chip', { active: !activeGroup }]"
          :aria-pressed="!activeGroup"
          @click="setGroup('')"
        >
          {{ t('matches.filters.allGroups') }}
        </button>
        <button
          v-for="g in availableGroups"
          :key="g"
          type="button"
          :class="['filter-btn group-chip', { active: activeGroup === g }]"
          :aria-pressed="activeGroup === g"
          @click="setGroup(g)"
        >
          {{ g }}
        </button>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="loadMatches" />

    <template v-else>
      <div v-if="viewMode === 'cards'">
        <MatchCard
          v-for="match in matches"
          :key="match.id"
          :match="match"
          :highlighted="String(match.matchNumber) === highlightedMatchNumber"
          @saved="loadMatches"
        />
        <div v-if="matches.length === 0" class="empty-state">
          <div class="empty-icon">⚽</div>
          <p>{{ t('matches.empty') }}</p>
        </div>
      </div>
      <div v-else class="card">
        <div class="card-body">
          <MatchTable :matches="matches" show-prediction @saved="loadMatches" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import { onSocketEvent } from '../services/socket';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import MatchCard from '../components/MatchCard.vue';
import MatchTable from '../components/MatchTable.vue';
import ErrorState from '../components/ErrorState.vue';

const { t } = useI18n();
const route = useRoute();
const VIEW_MODE_KEY = 'matches-view-mode';
const highlightedMatchNumber = ref('');

const filters = computed(() => [
  { value: '', label: t('matches.filters.all') },
  { value: 'open', label: t('matches.filters.open') },
  { value: 'finished', label: t('matches.filters.finished') },
  { value: 'missing', label: t('matches.filters.missing') },
  { value: 'group', label: t('matches.filters.group') },
  { value: 'knockout', label: t('matches.filters.knockout') },
]);

const DEFAULT_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const LOCK_WARNING_MS = 15 * 60 * 1000;

const activeFilter = ref('');
const activeGroup = ref('');
const groups = ref([]);
const availableGroups = computed(() => (groups.value.length ? groups.value : DEFAULT_GROUPS));
const matches = ref([]);
const loading = ref(true);
const error = ref('');
const viewMode = ref(localStorage.getItem(VIEW_MODE_KEY) || 'cards');
const now = ref(Date.now());
let unsub = null;
let lockTimer = null;

const lockWarning = computed(() => {
  const urgent = matches.value.filter((match) => {
    if (!match.canPredict) return false;
    const kickoff = new Date(match.kickoffTime).getTime();
    const remaining = kickoff - now.value;
    return remaining > 0 && remaining <= LOCK_WARNING_MS;
  });

  if (urgent.length === 0) return '';

  const missing = urgent.filter((m) => !m.hasPrediction);
  if (missing.length > 0) {
    return t('matches.lockWarningMissing', { count: missing.length });
  }
  return t('matches.lockWarningSoon', { count: urgent.length });
});

const needsLockTimer = computed(() =>
  matches.value.some((match) => {
    if (!match.canPredict) return false;
    const kickoff = new Date(match.kickoffTime).getTime();
    const remaining = kickoff - now.value;
    return remaining > 0 && remaining <= LOCK_WARNING_MS + 60_000;
  }),
);

const hasActiveFilters = computed(() => !!activeFilter.value || !!activeGroup.value);

const filterActiveLabel = computed(() => {
  const parts = [];
  const filterEntry = filters.value.find((f) => f.value === activeFilter.value);
  if (filterEntry?.value) parts.push(filterEntry.label);
  if (activeGroup.value) parts.push(`${t('matches.group')} ${activeGroup.value}`);
  return parts.length
    ? t('matches.filters.active', { filters: parts.join(' · ') })
    : t('matches.filters.all');
});

function syncLockTimer() {
  if (needsLockTimer.value && !lockTimer) {
    now.value = Date.now();
    lockTimer = setInterval(() => {
      now.value = Date.now();
    }, 1000);
  } else if (!needsLockTimer.value && lockTimer) {
    clearInterval(lockTimer);
    lockTimer = null;
  }
}

function setViewMode(mode) {
  viewMode.value = mode;
  localStorage.setItem(VIEW_MODE_KEY, mode);
}

function updateMatch(updated) {
  const idx = matches.value.findIndex((m) => m.id === updated.id);
  if (idx >= 0) {
    const existing = matches.value[idx];
    matches.value[idx] = { ...existing, ...updated, prediction: existing.prediction };
    syncLockTimer();
  }
}

async function loadGroups() {
  try {
    const { data } = await api.get('/matches/groups');
    groups.value = data;
  } catch {
    groups.value = [];
  }
}

async function loadMatches() {
  loading.value = true;
  error.value = '';
  try {
    const params = {};
    if (activeFilter.value) params.filter = activeFilter.value;
    if (activeGroup.value) params.groupName = activeGroup.value;
    const { data } = await api.get('/matches', { params });
    matches.value = data;
    syncLockTimer();
  } catch (err) {
    error.value = err.response?.data?.error || t('matches.loadFailed');
  } finally {
    loading.value = false;
  }
}

function setFilter(value) {
  activeFilter.value = value;
  loadMatches();
}

function setGroup(value) {
  activeGroup.value = value;
  loadMatches();
}

function resetFilters() {
  activeFilter.value = '';
  activeGroup.value = '';
  loadMatches();
}

async function focusMatchFromQuery() {
  const matchNumber = String(route.query.matchNumber || '').trim();
  if (!matchNumber) return;

  highlightedMatchNumber.value = matchNumber;
  await loadMatches();

  await nextTick();
  document.getElementById(`match-${matchNumber}`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });

  window.setTimeout(() => {
    highlightedMatchNumber.value = '';
  }, 4000);
}

onMounted(async () => {
  if (window.matchMedia('(max-width: 768px)').matches && viewMode.value === 'table') {
    viewMode.value = 'cards';
    localStorage.setItem(VIEW_MODE_KEY, 'cards');
  }

  await loadGroups();
  if (route.query.matchNumber) {
    await focusMatchFromQuery();
  } else {
    await loadMatches();
  }
  syncLockTimer();
  unsub = onSocketEvent('match:update', updateMatch);
});

watch(needsLockTimer, syncLockTimer);

onUnmounted(() => {
  unsub?.();
  if (lockTimer) clearInterval(lockTimer);
});
</script>

<style scoped>
.page-header--with-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.lock-warning,
.filter-active-banner {
  margin-bottom: 1rem;
}

.filter-active-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.group-filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.group-filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.group-chip-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.group-chip {
  min-width: 2.25rem;
  padding-inline: 0.65rem;
}

@media (max-width: 768px) {
  .view-toggle {
    width: 100%;
  }

  .view-toggle .btn {
    flex: 1;
  }
}
</style>
