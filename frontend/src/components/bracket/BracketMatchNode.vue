<template>
  <div
    class="bracket-node"
    :class="{
      finished: match.status === 'finished',
      projected: match.projected,
      live: isLive,
      'bracket-node--final': match.stage === 'FINAL',
      'bracket-node--third': match.stage === 'THIRD_PLACE',
    }"
    :style="style"
  >
    <div class="bracket-node-meta">
      <span class="bracket-node-number">{{ match.matchNumber }}</span>
      <span v-if="match.kickoffTime" class="bracket-node-time">{{ formatShortDateTime(match.kickoffTime) }}</span>
    </div>
    <div class="bracket-node-team" :class="{ winner: homeWins }">
      <TeamFlag v-if="match.homeTeam" :name="match.homeTeam" hide-name />
      <span class="bracket-node-label" :title="homeText">{{ homeText }}</span>
      <span v-if="showScore" class="bracket-node-score">{{ match.homeScore }}</span>
    </div>
    <div class="bracket-node-team" :class="{ winner: awayWins }">
      <TeamFlag v-if="match.awayTeam" :name="match.awayTeam" hide-name />
      <span class="bracket-node-label" :title="awayText">{{ awayText }}</span>
      <span v-if="showScore" class="bracket-node-score">{{ match.awayScore }}</span>
    </div>
    <div v-if="isLive" class="bracket-node-badge">{{ t('groupStandings.live') }}</div>
    <div v-else-if="match.projected" class="bracket-node-badge muted">{{ t('groupStandings.projected') }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFormatters } from '../../composables/useFormatters';
import TeamFlag from '../TeamFlag.vue';

const props = defineProps({
  match: { type: Object, required: true },
  formatSlot: { type: Function, required: true },
  left: { type: Number, required: true },
  top: { type: Number, required: true },
  width: { type: Number, default: 188 },
});

const { t } = useI18n();
const { formatDate, formatTime } = useFormatters();

function formatShortDateTime(value) {
  if (!value) return '';
  return `${formatDate(value, { year: undefined })} ${formatTime(value)}`;
}

const style = computed(() => ({
  left: `${props.left}px`,
  top: `${props.top}px`,
  width: `${props.width}px`,
}));

const homeText = computed(() => props.match.homeTeam || props.formatSlot(props.match.homeLabel || props.match.homeSlot));
const awayText = computed(() => props.match.awayTeam || props.formatSlot(props.match.awayLabel || props.match.awaySlot));

const isLive = computed(() => props.match.status === 'live' || props.match.status === 'halftime');

const showScore = computed(() => (props.match.status === 'finished' || isLive.value)
  && props.match.homeScore != null
  && props.match.awayScore != null);

const homeWins = computed(() => props.match.status === 'finished' && showScore.value && props.match.homeScore > props.match.awayScore);
const awayWins = computed(() => props.match.status === 'finished' && showScore.value && props.match.awayScore > props.match.homeScore);
</script>

<style scoped>
.bracket-node {
  position: absolute;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  padding: 0.4rem 0.5rem;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--color-text) 6%, transparent);
}

.bracket-node.finished {
  border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
}

.bracket-node.projected {
  border-style: dashed;
}

.bracket-node.live {
  border-color: var(--color-primary);
}

.bracket-node--final {
  border-width: 2px;
  border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
}

.bracket-node--third {
  opacity: 0.92;
}

.bracket-node-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.35rem;
  font-size: 0.65rem;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.bracket-node-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface));
  color: var(--color-primary);
  font-weight: 700;
}

.bracket-node-time {
  white-space: nowrap;
}

.bracket-node-team {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.3rem;
  align-items: center;
  min-height: 1.35rem;
  font-size: 0.78rem;
}

.bracket-node-team + .bracket-node-team {
  margin-top: 0.15rem;
}

.bracket-node-team.winner .bracket-node-label {
  font-weight: 700;
  color: var(--color-primary);
}

.bracket-node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bracket-node-score {
  font-weight: 700;
  min-width: 1rem;
  text-align: right;
}

.bracket-node-badge {
  margin-top: 0.25rem;
  font-size: 0.65rem;
  text-align: center;
  color: var(--color-primary);
  font-weight: 600;
}

.bracket-node-badge.muted {
  color: var(--color-text-muted);
  font-weight: 500;
}
</style>
