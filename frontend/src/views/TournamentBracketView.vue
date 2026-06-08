<template>
  <div class="tournament-bracket-view">
    <ErrorState v-if="error" :message="error" @retry="loadBracket" />
    <LoadingSpinner v-else-if="loading && !groups.length" />

    <div v-else-if="!groups.length" class="empty-state">
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

      <div class="tournament-bracket-layout" :class="{ 'tournament-bracket-layout--focus': focusBracket }">
        <aside v-if="!focusBracket" class="tournament-bracket-groups tournament-bracket-groups--left">
          <BracketGroupPanel
            v-for="block in leftGroups"
            :key="block.group"
            :group="block"
          />
        </aside>

        <section class="tournament-bracket-center card">
          <div class="card-header tournament-bracket-center-header">
            <h2>{{ t('tournamentBracket.knockoutTitle') }}</h2>
            <p class="text-muted">{{ t('tournamentBracket.knockoutSubtitle') }}</p>
          </div>
          <div class="card-body">
            <TournamentBracketTree
              v-if="knockoutPath.length"
              class="tournament-bracket-tree-desktop"
              :path="knockoutPath"
            />
            <TournamentBracketList
              v-if="knockoutPath.length"
              class="tournament-bracket-list-mobile"
              :path="knockoutPath"
            />
            <p v-else class="text-muted">{{ t('tournamentBracket.noKnockout') }}</p>
          </div>
        </section>

        <aside v-if="!focusBracket" class="tournament-bracket-groups tournament-bracket-groups--right">
          <BracketGroupPanel
            v-for="block in rightGroups"
            :key="block.group"
            :group="block"
          />
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import { onSocketEvent } from '../services/socket';
import { useFootballTeamStore } from '../stores/footballTeamStore';
import { useFullscreen } from '../composables/useFullscreen';
import { useFormatters } from '../composables/useFormatters';
import ErrorState from '../components/ErrorState.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import NavIcon from '../components/NavIcon.vue';
import BracketGroupPanel from '../components/bracket/BracketGroupPanel.vue';
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
const fullscreenRoot = ref(null);
const { isFullscreen, supported, toggle: toggleFullscreen } = useFullscreen(fullscreenRoot);
let unsub;

const LEFT_GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const RIGHT_GROUP_LETTERS = ['G', 'H', 'I', 'J', 'K', 'L'];

const hasResults = computed(() => groups.value.some(
  (block) => block.table.some((row) => row.playedGames > 0),
));

const leftGroups = computed(() => groups.value.filter((block) => LEFT_GROUP_LETTERS.includes(block.group)));
const rightGroups = computed(() => groups.value.filter((block) => RIGHT_GROUP_LETTERS.includes(block.group)));

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
}

.tournament-bracket-layout--focus {
  grid-template-columns: 1fr;
}

.tournament-bracket-hint {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.tournament-bracket-layout {
  display: grid;
  grid-template-columns: minmax(150px, 190px) minmax(520px, 1fr) minmax(150px, 190px);
  gap: 0.75rem;
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

@media (max-width: 1100px) {
  .tournament-bracket-layout {
    grid-template-columns: 1fr;
  }

  .tournament-bracket-groups {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  }
}
</style>
