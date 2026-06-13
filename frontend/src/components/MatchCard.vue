<template>
  <div :id="`match-${match.matchNumber}`" class="match-card" :class="{ 'match-card--highlight': highlighted }">
    <div class="match-card-header">
      <span>{{ matchRoundLabel(match) }}</span>
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
    <div class="match-teams">
      <div class="match-team">
        <TeamFlag :name="match.homeTeam" link-to-squad />
      </div>
      <div class="match-score-display" :class="scoreClass(match)">
        <template v-if="shouldShowScore(match)">
          {{ displayScore(match).home }} : {{ displayScore(match).away }}
        </template>
        <template v-else>{{ t('common.vs') }}</template>
      </div>
      <div class="match-team">
        <TeamFlag :name="match.awayTeam" link-to-squad />
      </div>
    </div>
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
    <div v-if="match.prediction" class="text-center mb-2">
      <span class="badge badge-info">{{ t('matches.yourTip') }}: {{ match.prediction.predictedHomeScore }} : {{ match.prediction.predictedAwayScore }}</span>
      <span v-if="match.prediction.points !== null" class="badge badge-success" style="margin-left: 0.5rem;">
        {{ formatPoints(match.prediction.points) }} {{ t('common.points') }}
      </span>
    </div>
    <div v-if="showForm && match.canPredict" class="match-actions">
      <PredictionForm
        :match="match"
        :prediction="match.prediction"
        @saved="$emit('saved')"
      />
    </div>
    <div v-else-if="!match.canPredict" class="match-locked text-center">
      <span class="match-lock-icon" :title="lockTitle">🔒</span>
      <span v-if="match.prediction" class="badge badge-info">
        {{ t('matches.yourTip') }}: {{ match.prediction.predictedHomeScore }} : {{ match.prediction.predictedAwayScore }}
      </span>
      <span v-else class="text-muted">{{ t('matches.noTipGiven') }}</span>
      <div class="text-muted match-lock-reason">{{ lockTitle }}</div>
    </div>
    <div v-else-if="!match.hasPrediction" class="text-center text-muted">
      {{ t('matches.noTipGiven') }}
    </div>
    <div v-if="match.highlightsUrl" class="text-center" style="margin-top: 0.5rem;">
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
import CountdownBadge from './CountdownBadge.vue';
import TeamFlag from './TeamFlag.vue';
import AIMatchPreview from './AIMatchPreview.vue';
import MatchVenueModal from './MatchVenueModal.vue';
import MatchWhatIfPanel from './MatchWhatIfPanel.vue';
import { useFormatters } from '../composables/useFormatters';
import { useMatchMeta } from '../composables/useMatchMeta';
import { getPredictionLockReason } from '../utils/predictionLockReason';

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
});

const lockTitle = computed(() => {
  const { key, kickoffTime } = getPredictionLockReason(props.match);
  if (key === 'predictions.lockReasonKickoff' && kickoffTime) {
    return t(key, { time: formatTime(kickoffTime), date: formatDate(kickoffTime) });
  }
  return t(key);
});

function extractYoutubeId(url) {
  if (!url) return '';
  const str = String(url).trim();
  try {
    const u = new URL(str);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '');
    }
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/').filter(Boolean);
    const embedIdx = parts.indexOf('embed');
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    const shortsIdx = parts.indexOf('shorts');
    if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
  } catch {
    // ignore parse errors
  }
  const m = str.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] || '';
}

const highlightsWatchUrl = computed(() => {
  const raw = String(props.match?.highlightsUrl || '').trim();
  const id = extractYoutubeId(props.match?.highlightsUrl);
  if (id) return `https://www.youtube.com/watch?v=${id}`;
  return raw;
});

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
.match-score-display--live {
  color: var(--color-text);
}

.match-score-display--finished {
  color: var(--color-success);
}

.match-lock-reason {
  margin-top: 0.35rem;
  font-size: 0.85rem;
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
