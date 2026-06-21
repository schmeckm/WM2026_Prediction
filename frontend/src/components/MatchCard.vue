<template>
  <div
    :id="`match-${match.matchNumber}`"
    class="match-card"
    :class="{
      'match-card--highlight': highlighted,
      'match-card--next': nextUp,
      'match-card--today': isToday,
    }"
  >
    <div class="match-card-top">
      <div class="match-card-header">
        <span class="match-card-round">{{ matchRoundLabel(match) }}</span>
        <div class="match-card-header-end">
          <div class="match-card-ref">
            <span class="match-ref">#{{ match.matchNumber }}</span>
            <span
              v-if="match.externalApiId"
              class="match-ref-external"
              :title="t('matchTable.externalRef')"
            >{{ match.externalApiId }}</span>
          </div>
          <span :class="['badge', `badge-${match.status}`]"><LiveScoreBadge :status="match.status" /></span>
        </div>
      </div>
    </div>

    <div class="match-card-middle">
      <div class="match-teams">
        <div class="match-team">
          <TeamFlag :name="match.homeTeam" link-to-squad />
        </div>
        <LiveMatchScoreboard
          v-if="showLiveScoreboard(match)"
          :match="match"
          size="card"
        />
        <div v-else class="match-score-display" :class="scoreClass(match)">
          <template v-if="shouldShowScore(match)">
            {{ displayScore(match).home }} : {{ displayScore(match).away }}
          </template>
          <template v-else>{{ t('common.vs') }}</template>
        </div>
        <div class="match-team">
          <TeamFlag :name="match.awayTeam" link-to-squad />
        </div>
      </div>
    </div>

    <div class="match-card-lower">
      <div class="match-meta">
        📅 {{ formatDate(match.kickoffTime) }} · 🕐 {{ formatTime(match.kickoffTime) }}
        <span v-if="match.stadium" class="match-venue">
          ·
          <button
            v-if="match.stadiumImageUrl"
            type="button"
            class="match-stadium-thumb-btn"
            :title="t('matches.stadiumPreview')"
            :aria-label="t('matches.stadiumPreview')"
            @click="showVenueModal = true"
          >
            <img
              :src="match.stadiumImageUrl"
              :alt="match.stadium"
              class="match-stadium-thumb"
              loading="lazy"
              decoding="async"
            />
          </button>
          <span v-else class="match-stadium-thumb-placeholder" aria-hidden="true">🏟️</span>
          <span class="match-venue-text">
            {{ match.stadium }}<template v-if="match.city">, {{ match.city }}</template>
          </span>
        </span>
        <CountdownBadge v-if="match.status === 'scheduled'" :kickoff-time="match.kickoffTime" />
      </div>
      <p v-if="showMarketOdds(match)" class="match-card-market-probs">
        {{ formatMarketProbabilities(match, t) }}
      </p>
      <div
        v-if="match.prediction || hasDisplayableResult(match) || !match.canPredict"
        class="match-card-tips-block"
      >
        <div v-if="match.prediction || hasDisplayableResult(match)" class="match-card-tips">
          <span v-if="match.prediction" class="badge badge-info">{{ t('matches.yourTip') }}: {{ match.prediction.predictedHomeScore }} : {{ match.prediction.predictedAwayScore }}</span>
          <span v-if="hasDisplayableResult(match)" class="badge badge-secondary">
            {{ t('matches.actualResult') }}: {{ displayMatchScore(match).home }} : {{ displayMatchScore(match).away }}
          </span>
          <span v-if="match.prediction?.points !== null && match.prediction?.points !== undefined" class="badge badge-success">
            {{ formatPoints(match.prediction.points) }} {{ t('common.points') }}
          </span>
        </div>
        <div v-if="!match.canPredict" class="match-lock-reason text-center text-muted">
          <span class="match-lock-icon" :title="lockTitle">🔒</span>
          {{ lockTitle }}
        </div>
      </div>
    </div>

    <div class="match-card-actions">
      <div v-if="showForm && match.canPredict" class="match-actions">
        <PredictionForm
          :match="match"
          :prediction="match.prediction"
          @saved="$emit('saved')"
        />
      </div>
      <div v-else-if="!match.canPredict && !match.prediction && !hasDisplayableResult(match)" class="match-locked text-center">
        <span class="match-lock-icon" :title="lockTitle">🔒</span>
        <span class="text-muted">{{ t('matches.noTipGiven') }}</span>
        <div class="text-muted match-lock-reason">{{ lockTitle }}</div>
      </div>
      <div v-else-if="!match.hasPrediction" class="text-center text-muted">
        {{ t('matches.noTipGiven') }}
      </div>
      <div v-if="match.highlightsUrl" class="match-card-highlights">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          @click="openHighlights"
        >
          {{ t('matches.highlights') }}
        </button>
      </div>
      <MatchWhatIfPanel v-if="match.status === 'finished'" :match="match" />
      <AIMatchPreview v-if="showAiPreview && !match.stadiumImageUrl" :match-id="match.id" />
    </div>
    <MatchVenueModal
      :open="showVenueModal"
      :match="match"
      :show-ai="showAiPreview"
      @close="showVenueModal = false"
    />
    <Teleport to="body">
      <div
        v-if="showHighlightsModal"
        class="modal-overlay"
        @click.self="closeHighlights"
      >
        <dialog
          class="modal"
          open
          :aria-label="t('matches.highlights')"
        >
          <div class="modal-header">
            <h3>{{ t('matches.highlights') }}</h3>
            <button
              type="button"
              class="modal-close"
              :aria-label="t('common.close')"
              @click="closeHighlights"
            >
              &times;
            </button>
          </div>
          <div class="modal-body">
            <div v-if="highlightsEmbedUrl" class="video-wrap">
              <iframe
                class="video-frame"
                :src="highlightsEmbedUrl"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              />
            </div>
            <p v-else class="text-muted" style="margin: 0;">
              {{ t('matches.highlightsInvalid') }}
            </p>

            <div class="highlights-actions">
              <a
                class="btn btn-primary btn-sm"
                :href="highlightsWatchUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ t('matches.watchOnYoutube') }}
              </a>
              <p class="text-muted highlights-hint">
                {{ t('matches.highlightsEmbedBlockedHint') }}
              </p>
            </div>
          </div>
        </dialog>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import {
  ref, computed, onMounted, onUnmounted,
} from 'vue';
import { useI18n } from 'vue-i18n';
import PredictionForm from './PredictionForm.vue';
import LiveScoreBadge from './LiveScoreBadge.vue';
import LiveMatchScoreboard from './LiveMatchScoreboard.vue';
import CountdownBadge from './CountdownBadge.vue';
import TeamFlag from './TeamFlag.vue';
import AIMatchPreview from './AIMatchPreview.vue';
import MatchVenueModal from './MatchVenueModal.vue';
import MatchWhatIfPanel from './MatchWhatIfPanel.vue';
import { useFormatters } from '../composables/useFormatters';
import { useMatchMeta } from '../composables/useMatchMeta';
import { hasDisplayableResult, displayMatchScore, formatMarketProbabilities, showMarketOdds } from '../composables/useMatchExtras';
import { getPredictionLockReason } from '../utils/predictionLockReason';
import { extractYoutubeId, buildYoutubeWatchUrl } from '../utils/youtubeUrl';
import { isLiveScoreboardMatch } from '../utils/liveMatchClock';

const showVenueModal = ref(false);
const showHighlightsModal = ref(false);

defineEmits(['saved']);

const { t } = useI18n();
const { formatDate, formatTime, formatPoints } = useFormatters();
const { matchRoundLabel } = useMatchMeta();

const props = defineProps({
  match: { type: Object, required: true },
  showForm: { type: Boolean, default: true },
  showAiPreview: { type: Boolean, default: true },
  highlighted: { type: Boolean, default: false },
  nextUp: { type: Boolean, default: false },
  isToday: { type: Boolean, default: false },
});

const lockTitle = computed(() => {
  const { key, kickoffTime } = getPredictionLockReason(props.match);
  if (key === 'predictions.lockReasonKickoff' && kickoffTime) {
    return t(key, { time: formatTime(kickoffTime), date: formatDate(kickoffTime) });
  }
  return t(key);
});

const highlightsWatchUrl = computed(() => buildYoutubeWatchUrl(props.match?.highlightsUrl));

const highlightsEmbedUrl = computed(() => {
  const id = extractYoutubeId(props.match?.highlightsUrl);
  if (!id) return '';
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
});

function openHighlights() {
  if (highlightsEmbedUrl.value) {
    showHighlightsModal.value = true;
  } else if (highlightsWatchUrl.value) {
    globalThis.open(highlightsWatchUrl.value, '_blank', 'noopener,noreferrer');
  }
}

function closeHighlights() {
  showHighlightsModal.value = false;
}

function onKeydown(event) {
  if (event.key === 'Escape' && showHighlightsModal.value) closeHighlights();
}

onMounted(() => {
  globalThis.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  globalThis.removeEventListener('keydown', onKeydown);
});

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
  const hasScore = match.homeScore !== null && match.homeScore !== undefined
    && match.awayScore !== null && match.awayScore !== undefined;
  if (hasScore) {
    return { home: match.homeScore, away: match.awayScore };
  }
  // If a match started but live sync hasn't arrived yet, avoid showing misleading 0:0.
  return { home: '–', away: '–' };
}

function scoreClass(match) {
  if (match.status === 'finished') return 'match-score-display--finished';
  if (match.status === 'live' || match.status === 'halftime') return 'match-score-display--live';
  const kickoffMs = new Date(match.kickoffTime).getTime();
  const startedByTime = Number.isFinite(kickoffMs) && Date.now() >= kickoffMs;
  if (startedByTime) return 'match-score-display--live';
  return '';
}
</script>

<style scoped>
.match-card-round {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-card-tips-block {
  margin-bottom: 0.5rem;
}

.match-card-tips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.375rem;
}

.match-card-tips-block .match-lock-reason,
.match-locked .match-lock-reason {
  margin-top: 0.35rem;
  font-size: 0.85rem;
}

.match-card-market-probs {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  line-height: 1.35;
}

.match-card-highlights {
  text-align: center;
  margin-top: 0.5rem;
}

.match-score-display--live {
  color: var(--color-text);
}

.match-score-display--finished {
  color: var(--color-success);
}

.match-card--next {
  border-color: var(--color-success);
  box-shadow: var(--shadow-md), inset 0 0 0 2px color-mix(in srgb, var(--color-success) 35%, transparent);
}

.match-card--today:not(.match-card--next) {
  border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
  box-shadow: var(--shadow-sm), inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 25%, transparent);
}

.video-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.video-frame {
  width: 100%;
  height: 100%;
  display: block;
}

.highlights-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.highlights-hint {
  margin: 0;
  font-size: 0.85rem;
  text-align: center;
  max-width: 520px;
}
</style>
