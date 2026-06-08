<template>
  <div class="bracket-zoom-toolbar" role="toolbar" :aria-label="t('tournamentBracket.zoomToolbar')">
    <button
      type="button"
      class="btn btn-sm btn-secondary"
      :disabled="zoom <= minZoom"
      :aria-label="t('tournamentBracket.zoomOut')"
      @click="$emit('zoom-out')"
    >
      −
    </button>
    <span class="bracket-zoom-value">{{ zoomPercent }}%</span>
    <button
      type="button"
      class="btn btn-sm btn-secondary"
      :disabled="zoom >= maxZoom"
      :aria-label="t('tournamentBracket.zoomIn')"
      @click="$emit('zoom-in')"
    >
      +
    </button>
    <button type="button" class="btn btn-sm btn-secondary" @click="$emit('reset')">
      {{ t('tournamentBracket.zoomReset') }}
    </button>
    <button type="button" class="btn btn-sm btn-secondary" @click="$emit('fit')">
      {{ t('tournamentBracket.zoomFit') }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  zoom: { type: Number, required: true },
  minZoom: { type: Number, default: 0.55 },
  maxZoom: { type: Number, default: 1.5 },
});

defineEmits(['zoom-in', 'zoom-out', 'reset', 'fit']);

const { t } = useI18n();
const zoomPercent = computed(() => Math.round(props.zoom * 100));
</script>

<style scoped>
.bracket-zoom-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.bracket-zoom-value {
  min-width: 3rem;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}
</style>
