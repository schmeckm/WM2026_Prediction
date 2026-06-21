<template>
  <div
    class="live-scoreboard"
    :class="[`live-scoreboard--${size}`]"
    aria-live="polite"
    :aria-label="ariaLabel"
  >
    <div class="live-scoreboard-bar">
      <div class="live-scoreboard-side live-scoreboard-side--home">
        <img
          v-if="homeFlag"
          :src="homeFlag"
          :alt="homeTeam"
          class="live-scoreboard-flag"
          loading="lazy"
        />
        <span v-else class="live-scoreboard-flag-fallback">{{ homeCode.slice(0, 2) }}</span>
        <span class="live-scoreboard-code">{{ homeCode }}</span>
      </div>

      <div class="live-scoreboard-center">
        <span class="live-scoreboard-score">{{ homeDisplay }}</span>
        <span class="live-scoreboard-emblem" aria-hidden="true">
          <img src="/wm2026-emblem.svg" alt="" />
        </span>
        <span class="live-scoreboard-score">{{ awayDisplay }}</span>
      </div>

      <div class="live-scoreboard-side live-scoreboard-side--away">
        <span class="live-scoreboard-code">{{ awayCode }}</span>
        <img
          v-if="awayFlag"
          :src="awayFlag"
          :alt="awayTeam"
          class="live-scoreboard-flag"
          loading="lazy"
        />
        <span v-else class="live-scoreboard-flag-fallback">{{ awayCode.slice(0, 2) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getTeamFlagImage } from '../utils/flags';
import { getFifaTeamCode } from '../utils/fifaTeamCodes';

const props = defineProps({
  match: { type: Object, required: true },
  size: {
    type: String,
    default: 'card',
    validator: (value) => ['card', 'compact'].includes(value),
  },
  /** @deprecated use size="compact" */
  compact: { type: Boolean, default: false },
});

const { t } = useI18n();

const size = computed(() => (props.compact ? 'compact' : props.size));

const homeTeam = computed(() => props.match.homeTeam || '');
const awayTeam = computed(() => props.match.awayTeam || '');
const homeCode = computed(() => getFifaTeamCode(homeTeam.value));
const awayCode = computed(() => getFifaTeamCode(awayTeam.value));
const flagSize = computed(() => (size.value === 'compact' ? 32 : 56));
const homeFlag = computed(() => getTeamFlagImage(homeTeam.value, flagSize.value));
const awayFlag = computed(() => getTeamFlagImage(awayTeam.value, flagSize.value));

function formatScore(value) {
  if (value === null || value === undefined) return '–';
  return String(value);
}

const homeDisplay = computed(() => formatScore(props.match.homeScore));
const awayDisplay = computed(() => formatScore(props.match.awayScore));

const ariaLabel = computed(() => {
  const status = props.match.status === 'halftime'
    ? t('matchStatus.halftime')
    : t('matchStatus.live');
  return `${status}: ${homeTeam.value} ${homeDisplay.value} ${t('common.vs')} ${awayDisplay.value} ${awayTeam.value}`;
});
</script>

<style scoped>
.live-scoreboard {
  flex-shrink: 0;
}

.live-scoreboard--card {
  min-width: 11rem;
  max-width: 16rem;
}

.live-scoreboard--compact {
  width: 100%;
  max-width: 100%;
}

.live-scoreboard-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.live-scoreboard--card .live-scoreboard-bar {
  gap: 0.5rem;
  padding: 0.55rem 0.85rem;
}

.live-scoreboard--compact .live-scoreboard-bar {
  padding: 0.2rem 0.4rem;
  gap: 0.2rem;
}

.live-scoreboard-side {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
}

.live-scoreboard--card .live-scoreboard-side {
  gap: 0.4rem;
}

.live-scoreboard-side--home {
  justify-content: flex-start;
}

.live-scoreboard-side--away {
  justify-content: flex-end;
}

.live-scoreboard-flag {
  width: 1.35rem;
  height: 0.95rem;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.live-scoreboard--card .live-scoreboard-flag {
  width: 1.85rem;
  height: 1.3rem;
}

.live-scoreboard--compact .live-scoreboard-flag {
  width: 1.1rem;
  height: 0.78rem;
}

.live-scoreboard-flag-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 0.95rem;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 0.55rem;
  font-weight: 700;
}

.live-scoreboard--card .live-scoreboard-flag-fallback {
  width: 1.85rem;
  height: 1.3rem;
  font-size: 0.65rem;
}

.live-scoreboard-code {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.live-scoreboard--card .live-scoreboard-code {
  font-size: 0.95rem;
}

.live-scoreboard--compact .live-scoreboard-code {
  font-size: 0.62rem;
}

.live-scoreboard-center {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  flex-shrink: 0;
}

.live-scoreboard--card .live-scoreboard-center {
  gap: 0.45rem;
}

.live-scoreboard-score {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.25rem;
  border-radius: 0.35rem;
  background: #67e8f9;
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.live-scoreboard--card .live-scoreboard-score {
  min-width: 2.35rem;
  height: 2.35rem;
  padding: 0 0.35rem;
  border-radius: 0.45rem;
  font-size: 1.75rem;
}

.live-scoreboard--compact .live-scoreboard-score {
  min-width: 1.15rem;
  height: 1.15rem;
  font-size: 0.72rem;
  border-radius: 0.28rem;
}

.live-scoreboard-emblem {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1.55rem;
  border-radius: 999px;
  background: #111;
  overflow: hidden;
  flex-shrink: 0;
}

.live-scoreboard--card .live-scoreboard-emblem {
  width: 1.35rem;
  height: 2.15rem;
}

.live-scoreboard--compact .live-scoreboard-emblem {
  width: 0.85rem;
  height: 1.3rem;
}

.live-scoreboard-emblem img {
  width: 78%;
  height: auto;
  object-fit: contain;
  filter: brightness(1.15);
}

@media (max-width: 640px) {
  .live-scoreboard--card {
    min-width: 9rem;
    max-width: 13rem;
  }

  .live-scoreboard--card .live-scoreboard-bar {
    padding: 0.4rem 0.65rem;
    gap: 0.35rem;
  }

  .live-scoreboard--card .live-scoreboard-score {
    min-width: 1.85rem;
    height: 1.85rem;
    font-size: 1.25rem;
  }

  .live-scoreboard--card .live-scoreboard-code {
    font-size: 0.78rem;
  }

  .live-scoreboard--card .live-scoreboard-flag,
  .live-scoreboard--card .live-scoreboard-flag-fallback {
    width: 1.45rem;
    height: 1rem;
  }

  .live-scoreboard--card .live-scoreboard-emblem {
    width: 1.1rem;
    height: 1.75rem;
  }
}
</style>
