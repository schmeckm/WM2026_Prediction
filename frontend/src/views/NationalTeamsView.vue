<template>
  <div>
    <div class="page-header">
      <h1>{{ t('nationalTeams.title') }}</h1>
      <span class="text-muted">{{ t('nationalTeams.subtitle') }}</span>
    </div>

    <div class="filter-bar mb-3">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :class="['filter-btn', { active: activeTab === tab.id }]"
        :aria-pressed="activeTab === tab.id"
        @click="switchTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <ErrorState v-if="error" :message="error" @retry="retryLoad" />

    <NationalTeamsSquadsTab
      v-else-if="activeTab === 'teams'"
      v-model:search="search"
      :loading-teams="loadingTeams"
      :loading-team-detail="loadingTeamDetail"
      :resolving-player-images="resolvingPlayerImages"
      :filtered-teams="filteredTeams"
      :selected-team="selectedTeam"
      :squad-groups="squadGroups"
      :missing-player-images="missingPlayerImages"
      :squad-image-progress="squadImageProgress"
      :position-label="positionLabel"
      :format-birth-date="formatBirthDate"
      @select-team="selectTeam"
      @load-player-images="loadPlayerImages"
    />

    <NationalTeamsStandingsTab
      v-else-if="activeTab === 'standings'"
      :loading="loadingStandings"
      :standings="standings"
      :standing-title="standingTitle"
    />

    <NationalTeamsScorersTab
      v-else-if="activeTab === 'scorers'"
      :loading="loadingScorers"
      :scorers="scorers"
      :top-scorers="topScorers"
      :source="scorersSource"
    />

    <NationalTeamsLiveTab
      v-else-if="activeTab === 'live'"
      :loading="loadingLive"
      :live-matches="liveMatches"
      :live-filter="liveFilter"
      :match-filters="matchFilters"
      :format-date-time="formatDateTime"
      @set-filter="setLiveFilter"
    />

    <NationalTeamsDuelsTab
      v-else-if="activeTab === 'duels'"
      v-model:duel-team-a-id="duelTeamAId"
      v-model:duel-team-b-id="duelTeamBId"
      :teams="teams"
      :can-compare="canCompareDuels"
      :duel-loading="duelLoading"
      :duel-data="duelData"
      @compare="compareDuels"
    />

    <NationalTeamsMarketTab v-else-if="activeTab === 'market'" />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import ErrorState from '../components/ErrorState.vue';
import NationalTeamsSquadsTab from '../components/nationalTeams/NationalTeamsSquadsTab.vue';
import NationalTeamsStandingsTab from '../components/nationalTeams/NationalTeamsStandingsTab.vue';
import NationalTeamsScorersTab from '../components/nationalTeams/NationalTeamsScorersTab.vue';
import NationalTeamsLiveTab from '../components/nationalTeams/NationalTeamsLiveTab.vue';
import NationalTeamsDuelsTab from '../components/nationalTeams/NationalTeamsDuelsTab.vue';
import NationalTeamsMarketTab from '../components/nationalTeams/NationalTeamsMarketTab.vue';
import { useNationalTeams } from '../composables/useNationalTeams';

const { t } = useI18n();

const {
  activeTab,
  teams,
  selectedTeam,
  standings,
  scorers,
  topScorers,
  scorersSource,
  liveMatches,
  loadingTeams,
  loadingTeamDetail,
  resolvingPlayerImages,
  loadingStandings,
  loadingScorers,
  loadingLive,
  error,
  search,
  liveFilter,
  duelTeamAId,
  duelTeamBId,
  duelData,
  duelLoading,
  tabs,
  matchFilters,
  filteredTeams,
  squadGroups,
  missingPlayerImages,
  squadImageProgress,
  canCompareDuels,
  selectTeam,
  loadPlayerImages,
  switchTab,
  setLiveFilter,
  compareDuels,
  positionLabel,
  standingTitle,
  formatBirthDate,
  formatDateTime,
  retryLoad,
} = useNationalTeams();
</script>
