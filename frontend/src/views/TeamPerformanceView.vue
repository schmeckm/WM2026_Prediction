<template>
  <div>
    <div class="page-header">
      <div>
        <h1>{{ t('teamPerformance.title') }}</h1>
        <span class="text-muted">{{ pageSubtitle }}</span>
      </div>
    </div>

    <div class="filter-bar team-performance-scope-bar">
      <button
        v-for="scope in scopeFilters"
        :key="scope.value"
        type="button"
        :class="['filter-btn', { active: activeScope === scope.value }]"
        :aria-pressed="activeScope === scope.value"
        :disabled="scope.disabled"
        @click="setScope(scope.value)"
      >
        {{ scope.label }}
      </button>
    </div>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="loadData" />

    <template v-else>
      <TeamPitchPanel
        v-if="displayMembers.length"
        :key="`pitch-${activeScope}-${displayMembers.length}`"
        :members="displayMembers"
        :show-team-name="activeScope === 'all'"
        :title-key="activeScope === 'all' ? 'teamPitch.titleAllTeams' : 'teamPitch.title'"
        :tagline-key="activeScope === 'all' ? 'teamPitch.taglineAllTeams' : 'teamPitch.tagline'"
      />

      <div v-if="activeScope === 'all'" class="card team-performance-header">
        <div class="card-body">
          <div class="team-performance-header-row">
            <div class="team-performance-header-title">
              <strong class="team-performance-team-name">{{ t('teamPerformance.allTeamsOverview') }}</strong>
              <div class="text-muted">
                {{ t('teamPerformance.teamCount', { count: teamRanking.length }) }}
                ·
                {{ t('teamPerformance.lineupSummary', { pitch: zoneSummary.pitch, yellow: zoneSummary.yellow, red: zoneSummary.red }) }}
              </div>
            </div>
            <router-link to="/team-ranking" class="btn btn-secondary btn-sm">
              {{ t('teamDashboard.fullRanking') }}
            </router-link>
          </div>
          <p class="text-muted team-performance-hint mb-0">
            {{ t('teamPerformance.allTeamsHint') }}
          </p>
        </div>
      </div>

      <div v-else-if="!teamId" class="card">
        <div class="card-body">
          <p class="text-muted mb-0">
            {{ t('teamPerformance.noTeam') }}
            <router-link to="/profile">{{ t('teamPerformance.goToProfile') }}</router-link>
          </p>
        </div>
      </div>

      <div v-else-if="teamEntry" class="card team-performance-header">
        <div class="card-body">
          <div class="team-performance-header-row">
            <TeamAvatar :image-url="teamEntry.imageUrl" :name="teamEntry.teamName" size="md" />
            <div class="team-performance-header-title">
              <strong class="team-performance-team-name">{{ teamEntry.teamName }}</strong>
              <div class="text-muted">
                {{ t('teamPerformance.teamRank', { rank: teamEntry.rank }) }}
                ·
                {{ t('teamPerformance.memberCount', { count: teamEntry.userCount }) }}
              </div>
            </div>
            <span class="badge badge-info">#{{ teamEntry.rank }}</span>
          </div>

          <div class="team-performance-stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ formatPoints(teamEntry.averagePoints) }}</div>
              <div class="stat-label">{{ t('teamPerformance.avgPoints') }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatPoints(teamEntry.totalPoints) }}</div>
              <div class="stat-label">{{ t('teamPerformance.totalPoints') }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatNumber(teamEntry.exactResults) }}</div>
              <div class="stat-label">{{ t('teamPerformance.exactTips') }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatNumber(teamEntry.completionRate) }}%</div>
              <div class="stat-label">{{ t('teamPerformance.completion') }}</div>
            </div>
          </div>

          <p class="text-muted team-performance-hint mb-0">
            {{ t('teamPerformance.privacyHint') }}
          </p>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3>⭐ {{ t('teamPerformance.highlightsTitle') }}</h3>
          </div>
          <div class="card-body">
            <ul v-if="highlights.length" class="highlights-list">
              <li v-for="h in highlights" :key="h.key">
                <strong>{{ h.title }}</strong>
                <div class="text-muted">{{ h.text }}</div>
              </li>
            </ul>
            <p v-else class="text-muted mb-0">{{ t('teamPerformance.noHighlights') }}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>👥 {{ t('teamPerformance.membersTitle') }}</h3>
          </div>
          <div class="card-body">
            <details class="card team-performance-columns-help">
              <summary class="card-header team-performance-columns-help__summary">
                {{ t('help.sections.scoring.title') }}
              </summary>
              <div class="card-body">
                <ul class="team-performance-columns-help__list">
                  <li>{{ t('help.scoring.exact', points) }}</li>
                  <li>{{ t('help.scoring.goalDiff', points) }}</li>
                  <li>{{ t('help.scoring.tendency', points) }}</li>
                  <li class="text-muted">
                    {{ t('leaderboard.correct') }} = {{ t('leaderboard.exact') }} + {{ t('leaderboard.goalDiff') }} + {{ t('leaderboard.tendency') }}
                  </li>
                </ul>
                <router-link to="/help" class="btn btn-secondary btn-sm">
                  {{ t('help.nav') }}
                </router-link>
              </div>
            </details>

            <div class="table-wrapper team-performance-desktop">
              <table>
                <thead>
                  <tr>
                    <th>{{ t('leaderboard.rank') }}</th>
                    <th>{{ t('leaderboard.name') }}</th>
                    <th v-if="activeScope === 'all'">{{ t('leaderboard.team') }}</th>
                    <th>{{ t('leaderboard.total') }}</th>
                    <th :title="`${t('leaderboard.correct')} = ${t('leaderboard.exact')} + ${t('leaderboard.goalDiff')} + ${t('leaderboard.tendency')}`">{{ t('leaderboard.correct') }}</th>
                    <th :title="t('help.scoring.exact', points)">{{ t('leaderboard.exact') }}</th>
                    <th :title="t('help.scoring.goalDiff', points)">{{ t('leaderboard.goalDiff') }}</th>
                    <th :title="t('help.scoring.tendency', points)">{{ t('leaderboard.tendency') }}</th>
                    <th>{{ t('leaderboard.tips') }}</th>
                    <th>{{ t('leaderboard.completion') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="m in displayMembers"
                    :key="m.userId"
                    :class="{ 'team-performance-row-current': m.userId === authStore.user?.id }"
                  >
                    <td>{{ m.rank }}</td>
                    <td>
                      <div class="member-name-cell">
                        <UserAvatar
                          :image-url="m.imageUrl"
                          :avatar-color="m.avatarColor"
                          :avatar-emoji="m.avatarEmoji"
                          :first-name="m.firstName"
                          :last-name="m.lastName"
                          size="xs"
                        />
                        <strong>{{ m.firstName }} {{ m.lastName }}</strong>
                        <span v-if="m.userId === authStore.user?.id" class="badge badge-info">{{ t('leaderboard.you') }}</span>
                      </div>
                    </td>
                    <td v-if="activeScope === 'all'">{{ m.teamName || '–' }}</td>
                    <td><strong>{{ formatPoints(m.totalPoints) }}</strong></td>
                    <td>{{ formatNumber(m.correctTips) }}</td>
                    <td>{{ formatNumber(m.exactResults) }}</td>
                    <td>{{ formatNumber(m.goalDifferences) }}</td>
                    <td>{{ formatNumber(m.tendencies) }}</td>
                    <td>{{ formatNumber(m.submittedPredictions) }}</td>
                    <td>{{ m.completionPercentage != null ? `${formatPercent(m.completionPercentage)}%` : '–' }}</td>
                  </tr>
                  <tr v-if="displayMembers.length === 0">
                    <td :colspan="activeScope === 'all' ? 10 : 9" class="text-center text-muted">{{ t('teamPerformance.empty') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="team-performance-mobile">
              <article v-for="m in displayMembers" :key="`mobile-${m.userId}`" class="member-card">
                <div class="member-card-header">
                  <span class="badge badge-info">#{{ m.rank }}</span>
                  <div class="member-name-cell">
                    <UserAvatar
                      :image-url="m.imageUrl"
                      :avatar-color="m.avatarColor"
                      :avatar-emoji="m.avatarEmoji"
                      :first-name="m.firstName"
                      :last-name="m.lastName"
                      size="xs"
                    />
                    <strong>{{ m.firstName }} {{ m.lastName }}</strong>
                  </div>
                </div>
                <dl class="member-card-fields">
                  <template v-if="activeScope === 'all'">
                    <dt>{{ t('leaderboard.team') }}</dt><dd>{{ m.teamName || '–' }}</dd>
                  </template>
                  <dt>{{ t('leaderboard.total') }}</dt><dd><strong>{{ formatPoints(m.totalPoints) }}</strong></dd>
                  <dt>{{ t('leaderboard.correct') }}</dt><dd>{{ formatNumber(m.correctTips) }}</dd>
                  <dt>{{ t('leaderboard.exact') }}</dt><dd>{{ formatNumber(m.exactResults) }}</dd>
                  <dt>{{ t('leaderboard.goalDiff') }}</dt><dd>{{ formatNumber(m.goalDifferences) }}</dd>
                  <dt>{{ t('leaderboard.tendency') }}</dt><dd>{{ formatNumber(m.tendencies) }}</dd>
                  <dt>{{ t('leaderboard.tips') }}</dt><dd>{{ formatNumber(m.submittedPredictions) }}</dd>
                  <dt>{{ t('leaderboard.completion') }}</dt><dd>{{ m.completionPercentage != null ? `${formatPercent(m.completionPercentage)}%` : '–' }}</dd>
                </dl>
              </article>
              <p v-if="displayMembers.length === 0" class="text-center text-muted mb-0">{{ t('teamPerformance.empty') }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ErrorState from '../components/ErrorState.vue';
import TeamAvatar from '../components/TeamAvatar.vue';
import UserAvatar from '../components/UserAvatar.vue';
import TeamPitchPanel from '../components/TeamPitchPanel.vue';
import { useAuthStore } from '../stores/authStore';
import { useFormatters } from '../composables/useFormatters';
import { useScoringRules } from '../composables/useScoringRules';
import { summarizeTeamPitchZones } from '../composables/useTeamPitchZones';

const { t } = useI18n();
const authStore = useAuthStore();
const { formatNumber, formatPoints, formatPercent } = useFormatters();
const { points } = useScoringRules();

const loading = ref(true);
const error = ref('');
const teamRanking = ref([]);
const membersRaw = ref([]);
const activeScope = ref('all');

const teamId = computed(() => {
  const user = authStore.user;
  if (!user) return null;
  const id = user.teamId ?? user.team?.id ?? null;
  if (id == null || id === '') return null;
  return Number(id);
});

const scopeFilters = computed(() => [
  { value: 'all', label: t('teamPerformance.filterAllTeams'), disabled: false },
  {
    value: 'myTeam',
    label: t('teamPerformance.filterMyTeam'),
    disabled: !teamId.value,
  },
]);

const pageSubtitle = computed(() => (
  activeScope.value === 'all'
    ? t('teamPerformance.subtitleAllTeams')
    : t('teamPerformance.subtitle')
));

const allMembers = computed(() => membersRaw.value.map((m) => ({
  ...m,
  correctTips: Number(m.exactResults || 0) + Number(m.goalDifferences || 0) + Number(m.tendencies || 0),
})));

const displayMembers = computed(() => allMembers.value);

function buildMembersParams() {
  const params = { filter: 'overall', sortBy: 'total' };
  if (activeScope.value === 'myTeam' && teamId.value) {
    params.teamId = teamId.value;
  }
  return params;
}

function memberMatchesTeam(member, resolvedTeamId) {
  if (!resolvedTeamId) return false;
  if (member.teamId != null && Number(member.teamId) === resolvedTeamId) return true;
  const userTeamName = authStore.user?.team?.name;
  return Boolean(userTeamName && member.teamName === userTeamName);
}

const zoneSummary = computed(() => summarizeTeamPitchZones(displayMembers.value));

const teamEntry = computed(() => {
  if (!teamId.value) return null;
  return teamRanking.value.find((e) => Number(e.teamId) === Number(teamId.value)) || null;
});

const highlights = computed(() => {
  if (!displayMembers.value.length) return [];
  const byExact = [...displayMembers.value].sort((a, b) => b.exactResults - a.exactResults || b.totalPoints - a.totalPoints);
  const byCorrect = [...displayMembers.value].sort((a, b) => b.correctTips - a.correctTips || b.totalPoints - a.totalPoints);
  const byPoints = [...displayMembers.value].sort((a, b) => b.totalPoints - a.totalPoints);

  const bestPoints = byPoints[0];
  const bestExact = byExact[0];
  const bestCorrect = byCorrect[0];

  const out = [];
  if (bestPoints) {
    out.push({
      key: 'bestPoints',
      title: t('teamPerformance.highlightBestPointsTitle'),
      text: t('teamPerformance.highlightBestPointsText', {
        name: `${bestPoints.firstName} ${bestPoints.lastName}`,
        points: formatPoints(bestPoints.totalPoints),
      }),
    });
  }
  if (bestExact) {
    out.push({
      key: 'bestExact',
      title: t('teamPerformance.highlightBestExactTitle'),
      text: t('teamPerformance.highlightBestExactText', {
        name: `${bestExact.firstName} ${bestExact.lastName}`,
        count: formatNumber(bestExact.exactResults),
      }),
    });
  }
  if (bestCorrect) {
    out.push({
      key: 'bestCorrect',
      title: t('teamPerformance.highlightBestCorrectTitle'),
      text: t('teamPerformance.highlightBestCorrectText', {
        name: `${bestCorrect.firstName} ${bestCorrect.lastName}`,
        count: formatNumber(bestCorrect.correctTips),
      }),
    });
  }
  return out;
});

function setScope(scope) {
  if (scope === 'myTeam' && !teamId.value) return;
  if (activeScope.value === scope) return;
  activeScope.value = scope;
}

async function loadMembers() {
  const { data } = await api.get('/leaderboard', { params: buildMembersParams() });
  let members = Array.isArray(data) ? data : [];
  if (activeScope.value === 'myTeam' && teamId.value) {
    members = members.filter((m) => memberMatchesTeam(m, teamId.value));
  }
  membersRaw.value = members;
}

async function loadData() {
  loading.value = true;
  error.value = '';
  try {
    const [rankRes] = await Promise.all([
      api.get('/leaderboard/team-ranking'),
      loadMembers(),
    ]);
    teamRanking.value = Array.isArray(rankRes.data) ? rankRes.data : [];
  } catch (err) {
    error.value = err.response?.data?.error || t('teamPerformance.loadFailed');
  } finally {
    loading.value = false;
  }
}

watch(activeScope, async (scope, previousScope) => {
  if (scope === previousScope || loading.value) return;
  try {
    await loadMembers();
  } catch (err) {
    error.value = err.response?.data?.error || t('teamPerformance.loadFailed');
  }
});

onMounted(async () => {
  if (authStore.isAuthenticated && teamId.value == null) {
    try {
      await authStore.fetchMe();
    } catch {
      // keep cached user payload
    }
  }
  await loadData();
});
</script>

<style scoped>
.team-performance-scope-bar {
  margin-bottom: 1.25rem;
}

.team-performance-header-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.team-performance-header-title {
  flex: 1;
}

.team-performance-team-name {
  font-size: 1.15rem;
}

.team-performance-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.team-performance-hint {
  font-size: 0.9rem;
}

.highlights-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.member-name-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.team-performance-row-current {
  background: var(--color-primary-soft);
}

.team-performance-mobile {
  display: none;
  flex-direction: column;
  gap: 0.75rem;
}

.member-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.875rem;
  background: var(--color-surface);
}

.member-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.member-card-fields {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.75rem;
  margin: 0;
}

.member-card-fields dt {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.member-card-fields dd {
  margin: 0;
}

@media (max-width: 768px) {
  .team-performance-desktop {
    display: none;
  }

  .team-performance-mobile {
    display: flex;
  }

  .team-performance-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.team-performance-columns-help {
  margin-bottom: 0.75rem;
}

.team-performance-columns-help__summary {
  cursor: pointer;
  user-select: none;
}

.team-performance-columns-help__list {
  margin: 0 0 0.75rem;
  padding-left: 1.25rem;
  line-height: 1.6;
}
</style>
