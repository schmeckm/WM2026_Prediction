<template>
  <div class="match-table">
    <div class="table-wrapper match-table-desktop">
      <table>
        <thead>
          <tr>
            <th>{{ t('matchTable.date') }}</th>
            <th>{{ t('matchTable.time') }}</th>
            <th>{{ t('matchTable.stage') }}</th>
            <th>{{ t('matchTable.group') }}</th>
            <th>{{ t('matchTable.home') }}</th>
            <th>{{ t('matchTable.away') }}</th>
            <th>{{ t('matchTable.result') }}</th>
            <th>{{ t('matchTable.status') }}</th>
            <th v-if="showPrediction">{{ t('matchTable.tip') }}</th>
            <th v-if="showPrediction">{{ t('matchTable.points') }}</th>
            <th v-if="showHighlights">{{ t('matchTable.highlights') }}</th>
            <th v-if="showActions">{{ t('common.actions') }}</th>
            <th v-if="showMatchRef" class="match-table-ref">{{ t('matchTable.ref') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="match in matches"
            :key="match.id"
            :class="{ 'match-row--next': isNextMatch(match), 'match-row--today': isTodayMatch(match) }"
          >
            <td>{{ formatDate(match.kickoffTime) }}</td>
            <td>{{ formatTime(match.kickoffTime) }}</td>
            <td>{{ stageLabel(match.stage) }}</td>
            <td>{{ match.groupName ? `${t('matches.group')} ${match.groupName}` : '–' }}</td>
            <td><TeamFlag :name="match.homeTeam" inline /></td>
            <td><TeamFlag :name="match.awayTeam" inline /></td>
            <td>
              <LiveMatchScoreboard
                v-if="showLiveScoreboard(match)"
                :match="match"
                compact
                class="match-table-live-scoreboard"
              />
              <span
                v-else-if="shouldShowScore(match)"
                :class="scoreClass(match)"
              >{{ displayScore(match).home }} : {{ displayScore(match).away }}</span>
              <span v-else class="text-muted">–</span>
            </td>
            <td><span :class="['badge', `badge-${match.status}`]">{{ statusLabel(match.status) }}</span></td>
            <td v-if="showPrediction">
              <PredictionForm
                v-if="editable && match.canPredict"
                :match="match"
                :prediction="match.prediction"
                compact
                @saved="$emit('saved', match)"
              />
              <span v-else-if="match.prediction">
                <span
                  v-if="editable && !match.canPredict"
                  class="lock-inline"
                  :title="predictionLockTitle(match)"
                  aria-label="locked"
                >🔒</span>
                {{ match.prediction.predictedHomeScore }} : {{ match.prediction.predictedAwayScore }}
                <MatchPredictionMeta :match="match" />
              </span>
              <span v-else class="text-muted">
                <span
                  v-if="editable && !match.canPredict"
                  class="lock-inline"
                  :title="predictionLockTitle(match)"
                  aria-label="locked"
                >🔒</span>
                –
                <MatchPredictionMeta :match="match" />
              </span>
            </td>
            <td v-if="showPrediction">
              <span v-if="match.prediction?.points !== null && match.prediction?.points !== undefined">{{ formatPoints(match.prediction.points) }}</span>
              <span v-else class="text-muted">–</span>
            </td>
            <td v-if="showHighlights">
              <MatchHighlightsLink
                :highlights-url="match.highlightsUrl"
                :highlights-meta="match.highlightsMeta"
              />
            </td>
            <td v-if="showActions">
              <div class="btn-group">
                <button class="btn btn-secondary btn-sm" @click="$emit('edit', match)">{{ t('common.edit') }}</button>
                <button class="btn btn-danger btn-sm" @click="$emit('delete', match)">{{ t('common.delete') }}</button>
              </div>
            </td>
            <td v-if="showMatchRef" class="match-table-ref">
              <MatchRefCell
                :match-number="match.matchNumber"
                :external-api-id="match.externalApiId"
              />
            </td>
          </tr>
          <tr v-if="matches.length === 0">
            <td :colspan="colspan" class="text-center text-muted">{{ t('matchTable.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="match-table-mobile">
      <article
        v-for="match in matches"
        :key="`mobile-${match.id}`"
        :class="['match-table-card', { 'match-table-card--next': isNextMatch(match), 'match-table-card--today': isTodayMatch(match) }]"
      >
        <LiveMatchScoreboard
          v-if="showLiveScoreboard(match)"
          :match="match"
          compact
          class="match-table-live-scoreboard match-table-live-scoreboard--mobile"
        />
        <div v-else class="match-table-card-teams">
          <TeamFlag :name="match.homeTeam" inline />
          <span class="match-table-card-vs">vs</span>
          <TeamFlag :name="match.awayTeam" inline />
        </div>
        <div class="match-table-card-meta">
          <span>{{ formatDate(match.kickoffTime) }} · {{ formatTime(match.kickoffTime) }}</span>
          <span :class="['badge', `badge-${match.status}`]">{{ statusLabel(match.status) }}</span>
        </div>
        <dl class="match-table-card-fields">
          <dt>{{ t('matchTable.stage') }}</dt>
          <dd>{{ stageLabel(match.stage) }}</dd>
          <dt>{{ t('matchTable.group') }}</dt>
          <dd>{{ match.groupName ? `${t('matches.group')} ${match.groupName}` : '–' }}</dd>
          <dt>{{ t('matchTable.result') }}</dt>
          <dd>
            <LiveMatchScoreboard
              v-if="showLiveScoreboard(match)"
              :match="match"
              compact
              class="match-table-live-scoreboard"
            />
            <span
              v-else-if="shouldShowScore(match)"
              :class="scoreClass(match)"
            >{{ displayScore(match).home }} : {{ displayScore(match).away }}</span>
            <span v-else class="text-muted">–</span>
          </dd>
          <template v-if="showPrediction">
            <dt>{{ t('matchTable.tip') }}</dt>
            <dd>
              <PredictionForm
                v-if="editable && match.canPredict"
                :match="match"
                :prediction="match.prediction"
                compact
                @saved="$emit('saved', match)"
              />
              <div v-else-if="match.prediction">
                <span
                  v-if="editable && !match.canPredict"
                  class="lock-inline"
                  :title="predictionLockTitle(match)"
                  aria-label="locked"
                >🔒</span>
                {{ match.prediction.predictedHomeScore }} : {{ match.prediction.predictedAwayScore }}
                <MatchPredictionMeta :match="match" />
                <div v-if="editable && !match.canPredict" class="lock-reason text-muted">
                  {{ predictionLockTitle(match) }}
                </div>
              </div>
              <div v-else class="text-muted">
                <span
                  v-if="editable && !match.canPredict"
                  class="lock-inline"
                  :title="predictionLockTitle(match)"
                  aria-label="locked"
                >🔒</span>
                –
                <MatchPredictionMeta :match="match" />
                <div v-if="editable && !match.canPredict" class="lock-reason">
                  {{ predictionLockTitle(match) }}
                </div>
              </div>
            </dd>
            <dt>{{ t('matchTable.points') }}</dt>
            <dd>
              <span v-if="match.prediction?.points !== null && match.prediction?.points !== undefined">{{ formatPoints(match.prediction.points) }}</span>
              <span v-else class="text-muted">–</span>
            </dd>
          </template>
          <template v-if="showHighlights">
            <dt>{{ t('matchTable.highlights') }}</dt>
            <dd>
              <MatchHighlightsLink
                :highlights-url="match.highlightsUrl"
                :highlights-meta="match.highlightsMeta"
              />
            </dd>
          </template>
          <template v-if="showMatchRef">
            <dt>{{ t('matchTable.ref') }}</dt>
            <dd>
              <MatchRefCell
                :match-number="match.matchNumber"
                :external-api-id="match.externalApiId"
              />
            </dd>
          </template>
        </dl>
        <div v-if="showActions" class="btn-group match-table-card-actions">
          <button class="btn btn-secondary btn-sm" @click="$emit('edit', match)">{{ t('common.edit') }}</button>
          <button class="btn btn-danger btn-sm" @click="$emit('delete', match)">{{ t('common.delete') }}</button>
        </div>
      </article>
      <p v-if="matches.length === 0" class="text-center text-muted">{{ t('matchTable.empty') }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFormatters } from '../composables/useFormatters';
import { useMatchMeta } from '../composables/useMatchMeta';
import TeamFlag from './TeamFlag.vue';
import MatchRefCell from './MatchRefCell.vue';
import PredictionForm from './PredictionForm.vue';
import MatchPredictionMeta from './MatchPredictionMeta.vue';
import MatchHighlightsLink from './MatchHighlightsLink.vue';
import LiveMatchScoreboard from './LiveMatchScoreboard.vue';
import { getPredictionLockReason } from '../utils/predictionLockReason';
import { DEFAULT_MATCH_TIMEZONE, getDateStringInTimezone } from '../utils/matchDate';
import { isLiveScoreboardMatch } from '../utils/liveMatchClock';

const props = defineProps({
  matches: { type: Array, default: () => [] },
  showPrediction: { type: Boolean, default: false },
  showHighlights: { type: Boolean, default: false },
  showActions: { type: Boolean, default: false },
  showMatchRef: { type: Boolean, default: true },
  editable: { type: Boolean, default: true },
  highlightMatchIds: { type: Array, default: () => [] },
  todayDateStr: { type: String, default: '' },
});

defineEmits(['edit', 'delete', 'saved']);

const { t } = useI18n();
const { formatDate, formatTime, formatPoints } = useFormatters();
const { stageLabel } = useMatchMeta();

const colspan = computed(() => {
  let cols = 8;
  if (props.showPrediction) cols += 2;
  if (props.showHighlights) cols += 1;
  if (props.showActions) cols += 1;
  if (props.showMatchRef) cols += 1;
  return cols;
});

const highlightIdSet = computed(() => new Set(props.highlightMatchIds.map(String)));

function isNextMatch(match) {
  return highlightIdSet.value.has(String(match?.id));
}

function isTodayMatch(match) {
  if (!props.todayDateStr) return false;
  return getDateStringInTimezone(match.kickoffTime, DEFAULT_MATCH_TIMEZONE) === props.todayDateStr;
}

function statusLabel(status) {
  return t(`matchStatus.${status}`, status);
}

function predictionLockTitle(match) {
  const { key, kickoffTime } = getPredictionLockReason(match);
  if (key === 'predictions.lockReasonKickoff' && kickoffTime) {
    return t(key, { time: formatTime(kickoffTime), date: formatDate(kickoffTime) });
  }
  return t(key);
}

function showLiveScoreboard(match) {
  return isLiveScoreboardMatch(match) && shouldShowScore(match);
}

function shouldShowScore(match) {
  const hasScore = match.homeScore !== null && match.homeScore !== undefined
    && match.awayScore !== null && match.awayScore !== undefined;
  if (hasScore) return match.status === 'live' || match.status === 'halftime' || match.status === 'finished';

  const kickoffMs = new Date(match.kickoffTime).getTime();
  const startedByTime = Number.isFinite(kickoffMs) && Date.now() >= kickoffMs;
  const canHavePlaceholder = match.status !== 'cancelled' && match.status !== 'postponed';
  return startedByTime && canHavePlaceholder;
}

function displayScore(match) {
  const home = match.homeScore ?? 0;
  const away = match.awayScore ?? 0;
  return { home, away };
}

function scoreClass(match) {
  if (match.status === 'finished') return 'match-score--finished';
  if (match.status === 'live' || match.status === 'halftime') return 'match-score--live';
  return '';
}
</script>

<style scoped>
.match-table-mobile {
  display: none;
}

.match-table-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.875rem;
  background: var(--color-surface);
}

.match-table-card--next {
  border-color: var(--color-success);
  box-shadow: var(--shadow-sm), 0 0 0 2px color-mix(in srgb, var(--color-success) 35%, transparent);
}

.match-row--next td {
  background: rgba(0, 255, 127, 0.04);
}

.match-row--next td:first-child {
  box-shadow:
    inset 2px 0 0 var(--color-success),
    inset 0 2px 0 var(--color-success),
    inset 0 -2px 0 var(--color-success);
}

.match-row--today td {
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
}

.match-table-card--today {
  border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
}

.match-row--next td:not(:first-child):not(:last-child) {
  box-shadow:
    inset 0 2px 0 var(--color-success),
    inset 0 -2px 0 var(--color-success);
}

.match-row--next td:last-child {
  box-shadow:
    inset -2px 0 0 var(--color-success),
    inset 0 2px 0 var(--color-success),
    inset 0 -2px 0 var(--color-success);
}

.lock-inline {
  display: inline-flex;
  margin-right: 0.25rem;
  opacity: 0.85;
}

.lock-reason {
  margin-top: 0.15rem;
  font-size: 0.8rem;
}

.match-score--live {
  color: var(--color-text);
}

.match-score--finished {
  color: var(--color-success);
  font-weight: 600;
}

.match-table-live-scoreboard {
  min-width: 220px;
}

.match-table-live-scoreboard--mobile {
  margin-bottom: 0.5rem;
}

.match-table-card-teams {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
}

.match-table-card-vs {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.match-table-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.match-table-card-fields {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.75rem;
  margin: 0 0 0.75rem;
}

.match-table-card-fields dt {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.match-table-card-fields dd {
  margin: 0;
  font-size: 0.875rem;
}

.match-table-card-actions {
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .match-table-desktop {
    display: none;
  }

  .match-table-mobile {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
