<template>
  <div class="market-analysis-tab">
    <div class="filter-bar mb-2 market-analysis-filters">
      <label class="market-analysis-filter">
        <span>{{ t('nationalTeams.market.teamFilter') }}</span>
        <select v-model="selectedTeam" class="form-control" @change="loadData">
          <option value="">{{ t('nationalTeams.market.allTeams') }}</option>
          <option v-for="team in teamOptions" :key="team" :value="team">{{ team }}</option>
        </select>
      </label>
      <label class="market-analysis-filter">
        <span>{{ t('nationalTeams.group') }}</span>
        <select v-model="selectedGroup" class="form-control" @change="loadData">
          <option value="">{{ t('nationalTeams.market.allGroups') }}</option>
          <option v-for="group in groupOptions" :key="group" :value="group">{{ group }}</option>
        </select>
      </label>
      <button type="button" class="btn btn-secondary btn-sm" :disabled="loading || !data" @click="exportCsv">
        {{ t('nationalTeams.market.exportCsv') }}
      </button>
    </div>

    <LoadingSpinner v-if="loading" />
    <p v-else-if="!data?.summary?.totalMatchesWithOdds" class="text-muted">
      {{ t('nationalTeams.market.empty') }}
    </p>

    <template v-else>
      <div class="card mb-2">
        <div class="card-header"><h3>{{ t('nationalTeams.market.summaryTitle') }}</h3></div>
        <div class="card-body stats-grid market-summary-grid">
          <div class="stat-card">
            <div class="stat-value">{{ data.summary.totalMatchesWithOdds }}</div>
            <div class="stat-label">{{ t('nationalTeams.market.matchesWithOdds') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ data.summary.finishedMatches }}</div>
            <div class="stat-label">{{ t('nationalTeams.market.finishedMatches') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ data.summary.overallMarketAccuracyPct != null ? `${data.summary.overallMarketAccuracyPct}%` : '–' }}
            </div>
            <div class="stat-label">{{ t('nationalTeams.market.overallAccuracy') }}</div>
          </div>
        </div>
      </div>

      <div class="card mb-2">
        <div class="card-header"><h3>{{ t('nationalTeams.market.chartTitle') }}</h3></div>
        <div class="card-body chart-container">
          <MarketWinRateChart :teams="chartTeams" />
        </div>
      </div>

      <div class="card mb-2">
        <div class="card-header"><h3>{{ t('nationalTeams.market.groupRankingTitle') }}</h3></div>
        <div class="card-body">
          <div v-if="data.groupRanking.length" class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{{ t('nationalTeams.group') }}</th>
                  <th>{{ t('nationalTeams.market.correct') }}</th>
                  <th>{{ t('nationalTeams.market.total') }}</th>
                  <th>{{ t('nationalTeams.market.accuracy') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="group in data.groupRanking" :key="group.groupName">
                  <td>{{ group.groupName }}</td>
                  <td>{{ group.correct }}</td>
                  <td>{{ group.total }}</td>
                  <td>{{ group.accuracyPct != null ? `${group.accuracyPct}%` : '–' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-muted mb-0">{{ t('nationalTeams.market.groupRankingEmpty') }}</p>
        </div>
      </div>

      <div class="card mb-2">
        <div class="card-header"><h3>{{ t('nationalTeams.market.teamTableTitle') }}</h3></div>
        <div class="card-body">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{{ t('nationalTeams.team') }}</th>
                  <th>{{ t('nationalTeams.played') }}</th>
                  <th>{{ t('nationalTeams.market.marketWinPct') }}</th>
                  <th>{{ t('nationalTeams.market.actualWinPct') }}</th>
                  <th>{{ t('nationalTeams.goals') }}</th>
                  <th>{{ t('nationalTeams.market.favoriteAccuracy') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="team in data.teams" :key="team.team">
                  <td>{{ team.team }}</td>
                  <td>{{ team.matchesFinished }}</td>
                  <td>{{ team.avgMarketWinPct != null ? `${team.avgMarketWinPct}%` : '–' }}</td>
                  <td>{{ team.actualWinPct != null ? `${team.actualWinPct}%` : '–' }}</td>
                  <td>{{ team.goalsFor }}:{{ team.goalsAgainst }}</td>
                  <td>{{ team.marketFavoriteAccuracyPct != null ? `${team.marketFavoriteAccuracyPct}%` : '–' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>{{ t('nationalTeams.market.timelineTitle') }}</h3></div>
        <div class="card-body">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ t('nationalTeams.market.kickoff') }}</th>
                  <th>{{ t('nationalTeams.market.match') }}</th>
                  <th>{{ t('nationalTeams.market.marketLine') }}</th>
                  <th>{{ t('nationalTeams.market.result') }}</th>
                  <th>{{ t('nationalTeams.market.favorite') }}</th>
                  <th>{{ t('nationalTeams.market.hit') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="match in data.timeline" :key="match.matchId">
                  <td>{{ match.matchNumber }}</td>
                  <td>{{ formatDateTime(match.kickoffTime) }}</td>
                  <td>{{ match.homeTeam }} vs {{ match.awayTeam }}</td>
                  <td>{{ formatMarketLine(match) }}</td>
                  <td>{{ formatResult(match) }}</td>
                  <td>{{ formatFavorite(match) }}</td>
                  <td>
                    <span v-if="match.marketCorrect === true" class="badge badge-success">✓</span>
                    <span v-else-if="match.marketCorrect === false" class="badge badge-danger">✗</span>
                    <span v-else class="text-muted">–</span>
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
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner.vue';
import MarketWinRateChart from '../charts/MarketWinRateChart.vue';
import { useFormatters } from '../../composables/useFormatters';

const { t } = useI18n();
const { formatDate, formatTime } = useFormatters();

function formatDateTime(value) {
  return `${formatDate(value)} ${formatTime(value)}`;
}

const loading = ref(false);
const data = ref(null);
const selectedTeam = ref('');
const selectedGroup = ref('');

const teamOptions = computed(() => data.value?.teams?.map((entry) => entry.team) || []);
const groupOptions = computed(() => {
  const groups = new Set((data.value?.matches || []).map((entry) => entry.groupName).filter(Boolean));
  return [...groups].sort();
});
const chartTeams = computed(() => (
  selectedTeam.value
    ? (data.value?.teams || []).filter((entry) => entry.team === selectedTeam.value)
    : (data.value?.teams || []).filter((entry) => entry.matchesFinished > 0).slice(0, 12)
));

function formatMarketLine(match) {
  return t('matches.marketProbabilities', {
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    home: match.homeMarketWinPct,
    draw: match.drawMarketPct,
    away: match.awayMarketWinPct,
  });
}

function formatResult(match) {
  if (match.status !== 'finished' || match.homeScore == null) return '–';
  return `${match.homeScore}:${match.awayScore}`;
}

function formatFavorite(match) {
  if (match.marketFavorite?.team) return match.marketFavorite.team;
  if (match.marketFavorite?.type === 'draw') return t('nationalTeams.market.drawFavorite');
  return '–';
}

async function loadData() {
  loading.value = true;
  try {
    const params = {};
    if (selectedTeam.value) params.team = selectedTeam.value;
    if (selectedGroup.value) params.groupName = selectedGroup.value;
    const { data: response } = await api.get('/statistics/market-analysis', { params });
    data.value = response;
  } catch {
    data.value = { teams: [], matches: [], timeline: [], groupRanking: [], summary: { totalMatchesWithOdds: 0 } };
  } finally {
    loading.value = false;
  }
}

async function exportCsv() {
  const params = {};
  if (selectedTeam.value) params.team = selectedTeam.value;
  if (selectedGroup.value) params.groupName = selectedGroup.value;
  const response = await api.get('/statistics/market-analysis/export', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'market-analysis.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

onMounted(loadData);

defineExpose({ loadData });
</script>

<style scoped>
.market-analysis-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: end;
}

.market-analysis-filter {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 180px;
}

.market-summary-grid {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.chart-container {
  height: 320px;
}
</style>
