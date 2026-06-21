<template>
  <div v-if="watchUrl" class="match-highlights-link-wrap">
    <a
      :href="watchUrl"
      class="match-highlights-link"
      target="_blank"
      rel="noopener noreferrer"
      :title="tooltipText"
    >
      <span class="match-highlights-link__icon" aria-hidden="true">▶</span>
      <span class="match-highlights-link__label">{{ linkLabel }}</span>
    </a>
    <p v-if="metaLine" class="match-highlights-link__meta">{{ metaLine }}</p>
  </div>
  <span v-else class="text-muted">–</span>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { buildYoutubeWatchUrl } from '../utils/youtubeUrl';
import { formatHighlightMetaLine, formatHighlightTooltip } from '../utils/highlightMeta';

const props = defineProps({
  highlightsUrl: { type: String, default: '' },
  highlightsMeta: { type: Object, default: null },
});

const { t } = useI18n();

const watchUrl = computed(() => {
  const url = buildYoutubeWatchUrl(props.highlightsUrl);
  return url || '';
});

const linkLabel = computed(() => props.highlightsMeta?.channelTitle || t('matches.highlights'));

const tooltipText = computed(() => formatHighlightTooltip(props.highlightsMeta, t('matches.highlights')));

const metaLine = computed(() => formatHighlightMetaLine(props.highlightsMeta, t));
</script>

<style scoped>
.match-highlights-link-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  min-width: 0;
}

.match-highlights-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  white-space: nowrap;
  max-width: 100%;
}

.match-highlights-link:hover {
  text-decoration: underline;
}

.match-highlights-link__icon {
  font-size: 0.7rem;
  flex-shrink: 0;
}

.match-highlights-link__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-highlights-link__meta {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.25;
  color: var(--color-text-muted, #6b7280);
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
