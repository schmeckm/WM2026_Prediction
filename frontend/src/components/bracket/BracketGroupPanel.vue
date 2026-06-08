<template>
  <div
    :id="`bracket-group-${group.group}`"
    class="bracket-group-panel"
    :class="{
      'bracket-group-panel--dimmed': highlightMode && !isActive,
      'bracket-group-panel--active': isActive,
    }"
  >
    <div class="bracket-group-header">
      <h3>{{ t('nationalTeams.group') }} {{ group.group }}</h3>
    </div>
    <p v-if="group.empty" class="bracket-group-empty text-muted">
      {{ t('tournamentBracket.noGroupData') }}
    </p>
    <ul v-else class="bracket-group-teams">
      <li
        v-for="row in group.table"
        :key="row.team.name"
        :class="{ qualified: row.position <= 2, 'third-spot': row.position === 3 }"
      >
        <span class="bracket-group-pos">{{ row.position }}</span>
        <TeamFlag :name="row.team.name" inline />
      </li>
    </ul>
    <ul v-if="group.allMatches?.length" class="bracket-group-matches">
      <li v-for="match in group.allMatches" :key="match.id || match.matchNumber">
        <div class="bracket-group-match-top">
          <div class="bracket-group-match-meta">
            <span class="bracket-group-date">{{ formatShortDate(match.kickoffTime) }}</span>
            <span class="bracket-group-time">{{ formatShortTime(match.kickoffTime) }}</span>
          </div>
          <span v-if="isLive(match)" class="bracket-group-live">
            {{ match.homeScore ?? 0 }}:{{ match.awayScore ?? 0 }}
          </span>
          <span v-else-if="hasScore(match)" class="bracket-group-score">{{ match.homeScore }}:{{ match.awayScore }}</span>
        </div>
        <div class="bracket-group-fixture">
          <TeamFlag :name="match.homeTeam" inline hide-name />
          <span class="bracket-group-vs">{{ t('groupStandings.vs') }}</span>
          <TeamFlag :name="match.awayTeam" inline hide-name />
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useFormatters } from '../../composables/useFormatters';
import TeamFlag from '../TeamFlag.vue';

defineProps({
  group: { type: Object, required: true },
  highlightMode: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
});

const { t } = useI18n();
const { formatDate, formatTime } = useFormatters();

function formatShortDate(value) {
  return formatDate(value, { year: undefined });
}

function formatShortTime(value) {
  return formatTime(value);
}

function isLive(match) {
  return match.status === 'live' || match.status === 'halftime';
}

function hasScore(match) {
  return match.status === 'finished'
    && match.homeScore != null
    && match.awayScore != null;
}
</script>

<style scoped>
.bracket-group-panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}

.bracket-group-panel--dimmed {
  opacity: 0.3;
}

.bracket-group-panel--active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 28%, transparent);
  transform: scale(1.03);
}

.bracket-group-empty {
  margin: 0;
  padding: 0.55rem 0.6rem 0.65rem;
  font-size: 0.72rem;
}

.bracket-group-header {
  padding: 0.45rem 0.6rem;
  background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
  border-bottom: 1px solid var(--color-border);
}

.bracket-group-header h3 {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-primary);
}

.bracket-group-teams,
.bracket-group-matches {
  list-style: none;
  margin: 0;
  padding: 0.45rem 0.55rem;
}

.bracket-group-teams {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border-bottom: 1px solid var(--color-border);
}

.bracket-group-teams li {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  min-width: 0;
}

.bracket-group-teams :deep(.team-with-flag) {
  min-width: 0;
  flex: 1;
}

.bracket-group-teams :deep(.team-name) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.bracket-group-teams li.qualified .bracket-group-pos {
  background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
  color: var(--color-primary);
}

.bracket-group-teams li.third-spot .bracket-group-pos {
  background: color-mix(in srgb, var(--color-warning, #d97706) 18%, var(--color-surface));
}

.bracket-group-pos {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--color-border);
}

.bracket-group-matches {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.bracket-group-matches li {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.72rem;
}

.bracket-group-match-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.bracket-group-match-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.bracket-group-date,
.bracket-group-time {
  color: inherit;
}

.bracket-group-fixture {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.bracket-group-vs {
  color: var(--color-text-muted);
  font-size: 0.65rem;
}

.bracket-group-live {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.65rem;
}

.bracket-group-score {
  font-weight: 700;
  font-size: 0.72rem;
}
</style>
