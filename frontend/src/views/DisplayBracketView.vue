<template>
  <div class="display-bracket">
    <header class="display-bracket-header">
      <div>
        <h1>{{ t('brand.title') }}</h1>
        <p class="display-bracket-subtitle">{{ t('tournamentBracket.displaySubtitle') }}</p>
      </div>
      <span class="display-bracket-updated">
        {{ t('display.updated') }}: {{ formatTime(lastUpdated) }}
      </span>
    </header>

    <BracketZoomToolbar
      :zoom="zoom"
      :min-zoom="minZoom"
      :max-zoom="maxZoom"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset="resetZoom"
      @fit="fitZoom"
    />

    <div v-if="!knockoutPath.length" class="display-bracket-empty">
      {{ t('tournamentBracket.noKnockout') }}
    </div>

    <TournamentBracketTree
      v-else
      class="display-bracket-tree"
      :path="knockoutPath"
      :zoom="zoom"
      :clickable="false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import { useFormatters } from '../composables/useFormatters';
import { useBracketZoom } from '../composables/useBracketZoom';
import {
  connectDisplaySocket,
  disconnectDisplaySocket,
  onDisplaySocketEvent,
} from '../services/socket';
import BracketZoomToolbar from '../components/bracket/BracketZoomToolbar.vue';
import TournamentBracketTree from '../components/bracket/TournamentBracketTree.vue';

const { t } = useI18n();
const { formatTime } = useFormatters();
const { zoom, zoomIn, zoomOut, resetZoom, fitZoom, minZoom, maxZoom } = useBracketZoom(0.75);

const knockoutPath = ref([]);
const lastUpdated = ref(new Date());
let fallbackTimer = null;
let unsubMatch = null;

async function loadBracket() {
  try {
    const { data } = await api.get('/display/bracket');
    knockoutPath.value = data.knockoutPath || [];
    lastUpdated.value = new Date(data.updatedAt || Date.now());
  } catch {
    // silent refresh for TV display
  }
}

onMounted(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
  loadBracket();
  connectDisplaySocket();
  unsubMatch = onDisplaySocketEvent('match:update', loadBracket);
  fallbackTimer = setInterval(loadBracket, 60000);
});

onUnmounted(() => {
  if (fallbackTimer) clearInterval(fallbackTimer);
  unsubMatch?.();
  disconnectDisplaySocket();
});
</script>

<style scoped>
.display-bracket {
  min-height: 100vh;
  padding: 1.5rem 2rem 2rem;
  background: #0A0A0A;
  color: #FFFFFF;
  position: relative;
}

.display-bracket::before {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse 70% 45% at 50% -10%, rgba(0, 255, 127, 0.14), transparent);
  pointer-events: none;
  z-index: 0;
}

.display-bracket-header,
.display-bracket-tree,
.bracket-zoom-toolbar,
.display-bracket-empty {
  position: relative;
  z-index: 1;
}

.display-bracket-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #2A2A2A;
}

.display-bracket-header h1 {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.display-bracket-subtitle {
  margin: 0.35rem 0 0;
  font-size: 1rem;
  color: #00FF7F;
  font-weight: 600;
}

.display-bracket-updated {
  color: #B8C0CC;
  font-size: 0.9rem;
  white-space: nowrap;
}

.display-bracket-empty {
  text-align: center;
  color: #B8C0CC;
  padding: 3rem 1rem;
}

.display-bracket-tree {
  --color-bg: #0A0A0A;
  --color-surface: #1A1A1A;
  --color-border: #2A2A2A;
  --color-text: #FFFFFF;
  --color-text-muted: #B8C0CC;
  --color-primary: #00FF7F;
}
</style>
