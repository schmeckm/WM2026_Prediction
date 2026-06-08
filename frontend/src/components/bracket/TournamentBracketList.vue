<template>
  <div class="tournament-bracket-list">
    <section v-for="section in sections" :key="section.stage" class="tournament-bracket-list-section">
      <h3>{{ section.title }}</h3>
      <article
        v-for="match in section.matches"
        :key="match.matchNumber"
        class="tournament-bracket-list-item"
        :class="{ finished: match.status === 'finished', live: isLive(match), projected: match.projected }"
      >
        <header class="tournament-bracket-list-header">
          <span>{{ t('groupStandings.match') }} {{ match.matchNumber }}</span>
          <span v-if="match.kickoffTime" class="text-muted">{{ formatDateTime(match.kickoffTime) }}</span>
        </header>
        <div class="tournament-bracket-list-teams">
          <div class="tournament-bracket-list-team" :class="{ winner: homeWins(match) }">
            <TeamFlag v-if="match.homeTeam" :name="match.homeTeam" hide-name />
            <span>{{ match.homeTeam || formatSlot(match.homeLabel || match.homeSlot) }}</span>
            <strong v-if="showScore(match)">{{ match.homeScore }}</strong>
          </div>
          <div class="tournament-bracket-list-team" :class="{ winner: awayWins(match) }">
            <TeamFlag v-if="match.awayTeam" :name="match.awayTeam" hide-name />
            <span>{{ match.awayTeam || formatSlot(match.awayLabel || match.awaySlot) }}</span>
            <strong v-if="showScore(match)">{{ match.awayScore }}</strong>
          </div>
        </div>
        <div v-if="isLive(match)" class="tournament-bracket-list-badge">{{ t('groupStandings.live') }}</div>
        <div v-else-if="match.projected" class="tournament-bracket-list-badge muted">{{ t('groupStandings.projected') }}</div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFormatters } from '../../composables/useFormatters';
import { useKnockoutBracket } from '../../composables/useKnockoutBracket';
import TeamFlag from '../TeamFlag.vue';

const props = defineProps({
  path: { type: Array, default: () => [] },
});

const { t } = useI18n();
const { formatDateTime } = useFormatters();
const { formatSlot, stageTitle, STAGE_ORDER } = useKnockoutBracket(toRef(props, 'path'));

const sections = computed(() => {
  const grouped = new Map();
  for (const match of props.path) {
    if (!grouped.has(match.stage)) grouped.set(match.stage, []);
    grouped.get(match.stage).push(match);
  }
  return STAGE_ORDER
    .filter((stage) => grouped.has(stage))
    .map((stage) => ({
      stage,
      title: stageTitle(stage),
      matches: grouped.get(stage),
    }));
});

function isLive(match) {
  return match.status === 'live' || match.status === 'halftime';
}

function showScore(match) {
  return (match.status === 'finished' || isLive(match))
    && match.homeScore != null
    && match.awayScore != null;
}

function homeWins(match) {
  return match.status === 'finished'
    && match.homeScore != null
    && match.awayScore != null
    && match.homeScore > match.awayScore;
}

function awayWins(match) {
  return match.status === 'finished'
    && match.homeScore != null
    && match.awayScore != null
    && match.awayScore > match.homeScore;
}
</script>

<style scoped>
.tournament-bracket-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tournament-bracket-list-section h3 {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: var(--color-primary);
}

.tournament-bracket-list-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}

.tournament-bracket-list-item + .tournament-bracket-list-item {
  margin-top: 0.5rem;
}

.tournament-bracket-list-item.finished {
  border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
}

.tournament-bracket-list-item.live {
  border-color: var(--color-primary);
}

.tournament-bracket-list-item.projected {
  border-style: dashed;
}

.tournament-bracket-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.78rem;
  font-weight: 600;
}

.tournament-bracket-list-teams {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.65rem 0.75rem;
}

.tournament-bracket-list-team {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 1.5rem;
  font-size: 0.85rem;
}

.tournament-bracket-list-team.winner {
  font-weight: 700;
  color: var(--color-primary);
}

.tournament-bracket-list-team strong {
  margin-left: auto;
}

.tournament-bracket-list-badge {
  padding: 0 0.75rem 0.55rem;
  font-size: 0.72rem;
  color: var(--color-primary);
  font-weight: 600;
}

.tournament-bracket-list-badge.muted {
  color: var(--color-text-muted);
  font-weight: 500;
}
</style>
