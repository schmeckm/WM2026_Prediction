<template>
  <div>
    <div class="page-header">
      <h1>{{ t('groupStandings.title') }}</h1>
      <span class="text-muted">
        {{ t('groupStandings.subtitle') }}
        <span v-if="lastUpdatedTime" class="admin-groups-updated">
          · {{ t('display.updated') }}: {{ lastUpdatedTime }}
        </span>
      </span>
    </div>

    <ErrorState v-if="error" :message="error" @retry="() => loadStandings()" />
    <LoadingSpinner v-else-if="loading && !groups.length" />

    <div v-else-if="groups.length === 0" class="empty-state">
      <p>{{ t('groupStandings.empty') }}</p>
    </div>

    <template v-else>
      <div class="admin-overview-grid">
        <section class="card admin-overview-card">
          <div class="card-header admin-overview-card__header">
            <h2>{{ t('display.liveMatches') }}</h2>
          </div>
          <div class="card-body">
            <div v-if="liveMatches.length === 0" class="text-muted admin-overview-empty">
              {{ t('display.noMatches') }}
            </div>
            <ul v-else class="admin-match-list">
              <li v-for="match in liveMatches" :key="match.id" class="admin-match-item">
                <span class="match-ref">#{{ match.matchNumber }}</span>
                <span class="admin-match-team">
                  <TeamLabel :name="match.homeTeam" />
                </span>
                <strong :class="['admin-match-score', scoreClass(match)]">
                  <template v-if="match.status === 'finished' || match.status === 'live' || match.status === 'halftime'">
                    {{ match.homeScore ?? '–' }} : {{ match.awayScore ?? '–' }}
                  </template>
                  <template v-else>{{ t('common.vs') }}</template>
                </strong>
                <span class="admin-match-team">
                  <TeamLabel :name="match.awayTeam" />
                </span>
                <LiveScoreBadge :status="match.status" />
              </li>
            </ul>
          </div>
        </section>

        <section class="card admin-overview-card">
          <div class="card-header admin-overview-card__header">
            <h2>{{ t('groupStandings.upcomingTitle') }}</h2>
          </div>
          <div class="card-body">
            <div v-if="upcomingGroupMatches.length === 0" class="text-muted admin-overview-empty">
              {{ t('groupStandings.noUpcoming') }}
            </div>
            <div v-else class="admin-next-list">
              <div
                v-for="match in upcomingGroupMatches.slice(0, 10)"
                :key="match.id || match.matchNumber"
                class="admin-next-row"
              >
                <span class="admin-next-group">{{ t('nationalTeams.group') }} {{ match.groupName }}</span>
                <span class="admin-next-date">{{ formatDateTime(match.kickoffTime) }}</span>
                <span class="admin-next-teams">
                  <TeamLabel :name="match.homeTeam" />
                  <span class="admin-next-vs">{{ t('groupStandings.vs') }}</span>
                  <TeamLabel :name="match.awayTeam" />
                </span>
              </div>
            </div>
          </div>
        </section>

        <section class="card admin-overview-card admin-overview-card--leaderboard">
          <div class="card-header admin-overview-card__header">
            <h2>{{ t('leaderboard.title') }}</h2>
          </div>
          <div class="card-body">
            <LoadingSpinner v-if="leaderboardLoading && !leaderboard.length" />
            <div v-else-if="leaderboard.length === 0" class="text-muted admin-overview-empty">
              {{ t('leaderboard.loadFailed') }}
            </div>
            <LeaderboardTable v-else :entries="leaderboard" :show-movement="false" :compact="true" />
          </div>
        </section>
      </div>

      <p v-if="!hasResults" class="admin-standings-hint text-muted">
        {{ t('groupStandings.preliminary') }}
      </p>

      <div class="admin-groups-grid">
        <div v-for="block in groups" :key="block.group" class="card admin-groups-card">
          <div class="card-header">
            <h3>{{ t('nationalTeams.group') }} {{ block.group }}</h3>
          </div>
          <div class="card-body">
            <GroupStandingsTable :table="block.table" />
            <GroupNextMatches :matches="block.nextMatches" />
            <GroupOutlook :outlook="block.outlook" />
          </div>
        </div>
      </div>

      <section v-if="knockoutPath.length" class="card admin-knockout-section">
        <div class="card-header">
          <h2>{{ t('groupStandings.knockoutTitle') }}</h2>
          <p class="text-muted admin-knockout-sub">{{ t('groupStandings.knockoutSubtitle') }}</p>
        </div>
        <div class="card-body">
          <KnockoutPathPreview :path="knockoutPath" />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../services/api';
import { onSocketEvent } from '../../services/socket';
import { useFormatters } from '../../composables/useFormatters';
import ErrorState from '../../components/ErrorState.vue';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import GroupStandingsTable from '../../components/GroupStandingsTable.vue';
import GroupNextMatches from '../../components/GroupNextMatches.vue';
import GroupOutlook from '../../components/GroupOutlook.vue';
import KnockoutPathPreview from '../../components/KnockoutPathPreview.vue';
import LeaderboardTable from '../../components/LeaderboardTable.vue';
import LiveScoreBadge from '../../components/LiveScoreBadge.vue';
import TeamLabel from '../../components/TeamLabel.vue';
import { useFootballTeamStore } from '../../stores/footballTeamStore';

const { t } = useI18n();
const { formatTime, formatDateTime } = useFormatters();
const footballTeamStore = useFootballTeamStore();

const groups = ref([]);
const upcomingGroupMatches = ref([]);
const knockoutPath = ref([]);
const liveMatches = ref([]);
const leaderboard = ref([]);
const loading = ref(false);
const leaderboardLoading = ref(false);
const error = ref('');
const lastUpdatedAt = ref(null);
let unsubMatch;
let unsubLeaderboard;

const lastUpdatedTime = computed(() => {
  if (!lastUpdatedAt.value) return '';
  return formatTime(lastUpdatedAt.value, { second: '2-digit' });
});

const hasResults = computed(() => groups.value.some(
  (block) => block.table.some((row) => row.playedGames > 0),
));

function scoreClass(match) {
  if (match?.status === 'finished') return 'admin-match-score--finished';
  if (match?.status === 'live' || match?.status === 'halftime') return 'admin-match-score--live';
  return '';
}

async function loadStandings({ silent = false } = {}) {
  if (!silent) loading.value = true;
  error.value = '';
  try {
    await footballTeamStore.ensureLoaded();
    const { data } = await api.get('/matches/group-standings');
    groups.value = data.groups || [];
    upcomingGroupMatches.value = data.upcomingGroupMatches || [];
    knockoutPath.value = data.knockoutPath || [];
    lastUpdatedAt.value = new Date();
  } catch (err) {
    error.value = err.response?.data?.error || t('groupStandings.loadFailed');
    if (!silent) {
      groups.value = [];
      upcomingGroupMatches.value = [];
      knockoutPath.value = [];
    }
  } finally {
    if (!silent) loading.value = false;
  }
}

async function loadLiveOverview() {
  try {
    const { data } = await api.get('/matches/live-overview');
    liveMatches.value = data.matches || [];
    lastUpdatedAt.value = new Date();
  } catch {
    liveMatches.value = [];
  }
}

async function loadLeaderboard() {
  leaderboardLoading.value = true;
  try {
    const { data } = await api.get('/leaderboard', { params: { filter: 'overall' } });
    leaderboard.value = (data || []).slice(0, 12);
    lastUpdatedAt.value = new Date();
  } catch {
    leaderboard.value = [];
  } finally {
    leaderboardLoading.value = false;
  }
}

function handleMatchUpdate(updated) {
  if (!updated) return;
  const affectsStandings = updated.groupName
    || updated.status === 'finished'
    || updated.status === 'live'
    || updated.status === 'halftime';
  if (affectsStandings) {
    loadStandings({ silent: true });
    loadLiveOverview();
  }
}

onMounted(async () => {
  await loadStandings();
  await Promise.all([
    loadLiveOverview(),
    loadLeaderboard(),
  ]);
  unsubMatch = onSocketEvent('match:update', handleMatchUpdate);
  unsubLeaderboard = onSocketEvent('leaderboard:update', loadLeaderboard);
});

onUnmounted(() => {
  unsubMatch?.();
  unsubLeaderboard?.();
});
</script>

<style scoped>
.admin-groups-updated {
  white-space: nowrap;
}

.admin-overview-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.admin-overview-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.admin-overview-card__header h2 {
  margin: 0;
  font-size: 1rem;
}

.admin-overview-empty {
  padding: 0.5rem 0;
}

.admin-match-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.admin-match-item {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 0.75rem;
  align-items: center;
}

.match-ref {
  color: var(--color-text-muted);
  font-weight: 700;
  white-space: nowrap;
}

.admin-match-team {
  min-width: 0;
  flex: 1 1 10rem;
}

.admin-match-score {
  text-align: center;
  white-space: nowrap;
  flex: 0 0 auto;
}

.admin-match-score--live {
  color: var(--color-primary);
}

.admin-next-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.admin-next-row {
  display: grid;
  grid-template-columns: 4.5rem 8.5rem 1fr;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.9rem;
}

.admin-next-group {
  font-weight: 700;
  color: var(--color-primary);
}

.admin-next-date {
  color: var(--color-text-muted);
  white-space: nowrap;
}

.admin-next-teams {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  min-width: 0;
}

.admin-next-vs {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.admin-standings-hint {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.admin-groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: 1rem;
}

.admin-groups-card .card-header h3 {
  margin: 0;
  font-size: 1rem;
}

.admin-groups-card .card-body {
  padding-top: 0.5rem;
  padding-bottom: 0.75rem;
}

.admin-knockout-section {
  margin-top: 1.5rem;
}

.admin-knockout-section h2 {
  margin: 0;
  font-size: 1.1rem;
}

.admin-knockout-sub {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
}

@media (max-width: 720px) {
  .admin-overview-grid {
    grid-template-columns: 1fr;
  }

  .admin-groups-grid {
    grid-template-columns: 1fr;
  }

  .admin-next-row {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}
</style>

