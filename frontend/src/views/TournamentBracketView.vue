<template>
  <div class="tournament-bracket-view">
    <ErrorState v-if="error" :message="error" @retry="loadBracket" />
    <LoadingSpinner v-else-if="loading" />

    <div v-else-if="!knockoutPath.length" class="empty-state">
      <p>{{ t('tournamentBracket.empty') }}</p>
    </div>

    <div
      v-else
      ref="fullscreenRoot"
      class="tournament-bracket-root"
    >
      <div class="page-header tournament-bracket-header">
        <div class="tournament-bracket-header-text">
          <h1>{{ t('tournamentBracket.title') }}</h1>
          <span class="text-muted">{{ t('tournamentBracket.subtitle') }}</span>
        </div>
        <div class="tournament-bracket-header-actions">
          <span v-if="lastUpdated" class="tournament-bracket-updated text-muted">
            {{ t('tournamentBracket.lastUpdated') }}: {{ formatTime(lastUpdated) }}
          </span>
          <button
            type="button"
            class="btn btn-secondary tournament-bracket-action-btn"
            :aria-pressed="focusBracket"
            @click="focusBracket = !focusBracket"
          >
            <NavIcon :name="focusBracket ? 'table' : 'bracket'" />
            <span>{{ focusBracket ? t('tournamentBracket.showGroups') : t('tournamentBracket.focusBracket') }}</span>
          </button>
          <router-link
            to="/display/bracket"
            target="_blank"
            class="btn btn-secondary tournament-bracket-action-btn"
          >
            <NavIcon name="matches" />
            <span>{{ t('tournamentBracket.displayMode') }}</span>
          </router-link>
          <button
            v-if="supported"
            type="button"
            class="btn btn-secondary tournament-bracket-action-btn"
            :aria-label="isFullscreen ? t('tournamentBracket.exitFullscreen') : t('tournamentBracket.fullscreen')"
            @click="toggleFullscreen"
          >
            <NavIcon :name="isFullscreen ? 'compress' : 'expand'" />
            <span>{{ isFullscreen ? t('tournamentBracket.exitFullscreen') : t('tournamentBracket.fullscreen') }}</span>
          </button>
        </div>
      </div>

      <p v-if="!hasResults" class="tournament-bracket-hint text-muted">
        {{ t('tournamentBracket.preliminary') }}
      </p>

      <div class="tournament-bracket-group-filter">
        <span class="tournament-bracket-group-filter-label">{{ t('tournamentBracket.highlightGroup') }}</span>
        <div class="tournament-bracket-group-chips" role="group" :aria-label="t('tournamentBracket.highlightGroup')">
          <button
            type="button"
            :class="['filter-btn', { active: !highlightedGroup }]"
            :aria-pressed="!highlightedGroup"
            @click="setHighlightedGroup('')"
          >
            {{ t('tournamentBracket.allGroups') }}
          </button>
          <button
            v-for="g in allGroupLetters"
            :key="g"
            type="button"
            :class="['filter-btn', { active: highlightedGroup === g }]"
            :aria-pressed="highlightedGroup === g"
            @click="setHighlightedGroup(g)"
          >
            {{ g }}
          </button>
        </div>
        <p v-if="highlightedGroup" class="tournament-bracket-highlight-banner">
          {{ t('tournamentBracket.groupHighlighted', { group: highlightedGroup }) }}
        </p>
        <span v-else class="tournament-bracket-group-filter-hint text-muted">
          {{ t('tournamentBracket.fullTreeHint') }}
        </span>
      </div>

      <div class="tournament-bracket-layout" :class="{ 'tournament-bracket-layout--focus': focusBracket }">
        <aside v-if="!focusBracket" class="tournament-bracket-groups tournament-bracket-groups--left">
          <BracketGroupPanel
            v-for="block in leftGroups"
            :key="block.group"
            :group="block"
            :highlight-mode="!!highlightedGroup"
            :is-active="block.group === highlightedGroup"
          />
        </aside>

        <section class="tournament-bracket-center card">
          <div class="card-header tournament-bracket-center-header">
            <h2>{{ t('tournamentBracket.knockoutTitle') }}</h2>
            <p class="text-muted">{{ t('tournamentBracket.knockoutSubtitle') }}</p>
          </div>
          <div class="card-body">
            <BracketZoomToolbar
              v-if="knockoutPath.length"
              :zoom="zoom"
              :min-zoom="minZoom"
              :max-zoom="maxZoom"
              @zoom-in="zoomIn"
              @zoom-out="zoomOut"
              @reset="resetZoom"
              @fit="fitZoom"
            />
            <TournamentBracketTree
              v-if="knockoutPath.length"
              class="tournament-bracket-tree-desktop"
              :path="knockoutPath"
              :zoom="zoom"
              :highlighted-group="highlightedGroup"
            />
            <TournamentBracketList
              v-if="knockoutPath.length"
              class="tournament-bracket-list-mobile"
              :path="knockoutPath"
              :highlighted-group="highlightedGroup"
            />
            <p v-else class="text-muted">{{ t('tournamentBracket.noKnockout') }}</p>
          </div>
        </section>

        <aside v-if="!focusBracket" class="tournament-bracket-groups tournament-bracket-groups--right">
          <BracketGroupPanel
            v-for="block in rightGroups"
            :key="block.group"
            :group="block"
            :highlight-mode="!!highlightedGroup"
            :is-active="block.group === highlightedGroup"
          />
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import { onSocketEvent } from '../services/socket';
import { useFootballTeamStore } from '../stores/footballTeamStore';
import { useFullscreen } from '../composables/useFullscreen';
import { useBracketZoom } from '../composables/useBracketZoom';
import { useFormatters } from '../composables/useFormatters';
import { BRACKET_GROUP_LETTERS, mergeBracketGroups } from '../composables/useBracketGroupHighlight';
import ErrorState from '../components/ErrorState.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import NavIcon from '../components/NavIcon.vue';
import BracketGroupPanel from '../components/bracket/BracketGroupPanel.vue';
import BracketZoomToolbar from '../components/bracket/BracketZoomToolbar.vue';
import TournamentBracketTree from '../components/bracket/TournamentBracketTree.vue';
import TournamentBracketList from '../components/bracket/TournamentBracketList.vue';

const { t } = useI18n();
const { formatTime } = useFormatters();
const footballTeamStore = useFootballTeamStore();

const groups = ref([]);
const knockoutPath = ref([]);
const loading = ref(false);
const error = ref('');
const lastUpdated = ref(null);
const focusBracket = ref(false);
const highlightedGroup = ref('');
const fullscreenRoot = ref(null);
const { isFullscreen, supported, toggle: toggleFullscreen } = useFullscreen(fullscreenRoot);
const { zoom, zoomIn, zoomOut, resetZoom, fitZoom, minZoom, maxZoom } = useBracketZoom(1);
let unsub;

const LEFT_GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const RIGHT_GROUP_LETTERS = ['G', 'H', 'I', 'J', 'K', 'L'];
const allGroupLetters = BRACKET_GROUP_LETTERS;

const displayGroups = computed(() => mergeBracketGroups(groups.value));

const hasResults = computed(() => displayGroups.value.some(
  (block) => block.table.some((row) => row.playedGames > 0),
));

const leftGroups = computed(() => displayGroups.value.filter((block) => LEFT_GROUP_LETTERS.includes(block.group)));
const rightGroups = computed(() => displayGroups.value.filter((block) => RIGHT_GROUP_LETTERS.includes(block.group)));

function setHighlightedGroup(group) {
  highlightedGroup.value = group;
  if (group && focusBracket.value) focusBracket.value = false;
  if (!group) return;

  nextTick(() => {
    document.getElementById(`bracket-group-${group}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  });
}

async function loadBracket({ silent = false } = {}) {
  if (!silent) loading.value = true;
  error.value = '';
  try {
    await footballTeamStore.ensureLoaded();
    const { data } = await api.get('/matches/group-standings');
    groups.value = data.groups || [];
    knockoutPath.value = data.knockoutPath || [];
    lastUpdated.value = new Date();
  } catch (err) {
    error.value = err.response?.data?.error || t('tournamentBracket.loadFailed');
    if (!silent) {
      groups.value = [];
      knockoutPath.value = [];
    }
  } finally {
    if (!silent) loading.value = false;
  }
}

function handleMatchUpdate(updated) {
  if (!updated) return;
  const affectsStandings = updated.groupName
    || updated.status === 'finished'
    || updated.status === 'live'
    || updated.status === 'halftime';
  if (affectsStandings) {
    loadBracket({ silent: true });
  }
}

onMounted(async () => {
  await loadBracket();
  unsub = onSocketEvent('match:update', handleMatchUpdate);
});

onUnmounted(() => {
  unsub?.();
});
</script>

<style scoped>
.tournament-bracket-root:fullscreen {
  overflow: auto;
  padding: 1rem 1.25rem 1.5rem;
  background: var(--color-bg);
}

.tournament-bracket-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.tournament-bracket-header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tournament-bracket-updated {
  font-size: 0.8rem;
  white-space: nowrap;
}

.tournament-bracket-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  white-space: nowrap;
  text-decoration: none;
}

.tournament-bracket-layout--focus {
  grid-template-columns: 1fr;
}

.tournament-bracket-hint {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.tournament-bracket-group-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 1rem;
}

.tournament-bracket-group-filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.tournament-bracket-group-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tournament-bracket-group-filter-hint,
.tournament-bracket-highlight-banner {
  font-size: 0.8rem;
  flex: 1 1 100%;
}

.tournament-bracket-highlight-banner {
  margin: 0;
  color: var(--color-primary);
  font-weight: 600;
}

.tournament-bracket-layout {
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(480px, 1fr) minmax(240px, 300px);
  gap: 1rem;
  align-items: start;
}

.tournament-bracket-groups {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.tournament-bracket-center-header h2 {
  margin: 0;
  font-size: 1.05rem;
}

.tournament-bracket-center-header p {
  margin: 0.3rem 0 0;
  font-size: 0.85rem;
}

.tournament-bracket-center .card-body {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.tournament-bracket-list-mobile {
  display: none;
}

@media (max-width: 768px) {
  .tournament-bracket-tree-desktop {
    display: none;
  }

  .tournament-bracket-list-mobile {
    display: block;
  }
}

@media (max-width: 1280px) {
  .tournament-bracket-layout {
    grid-template-columns: minmax(220px, 260px) minmax(420px, 1fr) minmax(220px, 260px);
  }
}

@media (max-width: 1100px) {
  .tournament-bracket-layout {
    grid-template-columns: 1fr;
  }

  .tournament-bracket-groups {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.75rem;
  }
}
</style>
