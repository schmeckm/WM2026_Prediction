<template>
  <div class="favorites-overview">
    <div class="page-header">
      <div>
        <h1>{{ t('favoritesOverview.title') }}</h1>
        <p v-if="!loading" class="page-subtitle">{{ t('favoritesOverview.subtitle') }}</p>
      </div>
    </div>

    <ErrorState v-if="loadError" :message="loadError" @retry="loadFavorites" />
    <LoadingSpinner v-else-if="loading" />

    <template v-else>
      <div class="stats-grid mb-2">
        <div class="stat-card">
          <div class="stat-value">{{ data.summary.withTopScorerPick }}</div>
          <div class="stat-label">{{ t('favoritesOverview.stats.withTopScorer') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ data.summary.uniqueTopScorerPicks }}</div>
          <div class="stat-label">{{ t('favoritesOverview.stats.uniquePlayers') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ data.summary.withFavoriteTeam }}</div>
          <div class="stat-label">{{ t('favoritesOverview.stats.withFavoriteTeam') }}</div>
        </div>
        <div class="stat-card accent">
          <div class="stat-value">{{ data.summary.mostPopularPlayer || '–' }}</div>
          <div class="stat-label">{{ t('favoritesOverview.stats.mostPopularPlayer') }}</div>
        </div>
      </div>

      <div class="filter-bar">
        <input
          v-model="search"
          type="search"
          class="form-control favorites-search"
          :placeholder="t('favoritesOverview.searchPlaceholder')"
        />
      </div>

      <div class="card mb-2">
        <div class="card-header">
          <h3>{{ t('favoritesOverview.topScorerSection') }}</h3>
          <span class="text-muted">{{ t('favoritesOverview.pickCount', { count: data.summary.withTopScorerPick }) }}</span>
        </div>
        <div class="card-body card-body-table">
          <div class="table-wrapper">
            <table class="favorites-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ t('favoritesOverview.columns.player') }}</th>
                  <th>{{ t('favoritesOverview.columns.nationalTeam') }}</th>
                  <th>{{ t('favoritesOverview.columns.picks') }}</th>
                  <th>{{ t('favoritesOverview.columns.share') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(pick, index) in filteredTopScorerPicks" :key="pickKey(pick)">
                  <td class="favorites-rank">{{ index + 1 }}</td>
                  <td>
                    <div class="favorites-player">
                      <PlayerAvatar
                        :image-url="pick.imageUrl"
                        :name="pick.playerName || '?'"
                        :image-source="pick.imageSource"
                        size="sm"
                      />
                      <strong>{{ pick.playerName || '–' }}</strong>
                    </div>
                  </td>
                  <td>
                    <TeamFlag v-if="pick.teamName" :name="pick.teamName" inline />
                    <span v-else class="text-muted">–</span>
                  </td>
                  <td><span class="badge badge-info">{{ pick.pickCount }}</span></td>
                  <td>
                    <div class="favorites-share">
                      <div class="favorites-bar">
                        <div class="favorites-bar-fill" :style="{ width: `${pick.percentage}%` }" />
                      </div>
                      <span>{{ pick.percentage }}%</span>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredTopScorerPicks.length === 0">
                  <td colspan="5" class="text-center text-muted favorites-empty">
                    {{ search ? t('favoritesOverview.emptyFiltered') : t('favoritesOverview.emptyTopScorer') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>{{ t('favoritesOverview.favoriteTeamSection') }}</h3>
          <span class="text-muted">{{ t('favoritesOverview.pickCount', { count: data.summary.withFavoriteTeam }) }}</span>
        </div>
        <div class="card-body card-body-table">
          <div class="table-wrapper">
            <table class="favorites-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ t('favoritesOverview.columns.team') }}</th>
                  <th>{{ t('favoritesOverview.columns.picks') }}</th>
                  <th>{{ t('favoritesOverview.columns.share') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(team, index) in filteredFavoriteTeams" :key="teamKey(team)">
                  <td class="favorites-rank">{{ index + 1 }}</td>
                  <td>
                    <TeamFlag v-if="team.teamName" :name="team.teamName" />
                    <span v-else class="text-muted">–</span>
                  </td>
                  <td><span class="badge badge-info">{{ team.pickCount }}</span></td>
                  <td>
                    <div class="favorites-share">
                      <div class="favorites-bar">
                        <div class="favorites-bar-fill favorites-bar-fill-team" :style="{ width: `${team.percentage}%` }" />
                      </div>
                      <span>{{ team.percentage }}%</span>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredFavoriteTeams.length === 0">
                  <td colspan="4" class="text-center text-muted favorites-empty">
                    {{ search ? t('favoritesOverview.emptyFiltered') : t('favoritesOverview.emptyFavoriteTeam') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ErrorState from '../components/ErrorState.vue';
import PlayerAvatar from '../components/PlayerAvatar.vue';
import TeamFlag from '../components/TeamFlag.vue';

const { t } = useI18n();

const loading = ref(true);
const loadError = ref('');
const search = ref('');
const data = ref({
  summary: {
    totalUsers: 0,
    withTopScorerPick: 0,
    withFavoriteTeam: 0,
    withoutTopScorerPick: 0,
    withoutFavoriteTeam: 0,
    uniqueTopScorerPicks: 0,
    uniqueFavoriteTeams: 0,
    mostPopularPlayer: null,
    mostPopularTeam: null,
  },
  topScorerPicks: [],
  favoriteTeams: [],
});

function pickKey(pick) {
  return pick.playerId ? `player:${pick.playerId}` : `player:${pick.playerName}`;
}

function teamKey(team) {
  return team.teamId ? `team:${team.teamId}` : `team:${team.teamName}`;
}

function matchesSearch(text) {
  const q = search.value.trim().toLowerCase();
  if (!q) return true;
  return String(text || '').toLowerCase().includes(q);
}

const filteredTopScorerPicks = computed(() => data.value.topScorerPicks.filter((pick) => (
  matchesSearch(pick.playerName) || matchesSearch(pick.teamName)
)));

const filteredFavoriteTeams = computed(() => data.value.favoriteTeams.filter((team) => (
  matchesSearch(team.teamName)
)));

async function loadFavorites() {
  loading.value = true;
  loadError.value = '';
  try {
    const { data: response } = await api.get('/statistics/favorites');
    data.value = response;
  } catch (err) {
    loadError.value = err.response?.data?.error || t('favoritesOverview.loadFailed');
  } finally {
    loading.value = false;
  }
}

onMounted(loadFavorites);
</script>

<style scoped>
.page-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.favorites-search {
  flex: 1;
  min-width: 220px;
  max-width: 420px;
}

.card-body-table {
  padding: 0;
}

.favorites-table th {
  white-space: nowrap;
}

.favorites-rank {
  width: 2.5rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.favorites-player {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.favorites-share {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 8rem;
}

.favorites-bar {
  flex: 1;
  height: 0.5rem;
  background: var(--color-border);
  border-radius: 999px;
  overflow: hidden;
}

.favorites-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
}

.favorites-bar-fill-team {
  background: var(--color-success);
}

.favorites-empty {
  padding: 2rem 1rem;
}
</style>

