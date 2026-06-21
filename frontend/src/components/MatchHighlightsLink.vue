<template>
  <a
    v-if="watchUrl"
    :href="watchUrl"
    class="match-highlights-link"
    target="_blank"
    rel="noopener noreferrer"
    :title="t('matches.highlights')"
  >
    <span class="match-highlights-link__icon" aria-hidden="true">▶</span>
    <span>{{ t('matches.highlights') }}</span>
  </a>
  <span v-else class="text-muted">–</span>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { buildYoutubeWatchUrl } from '../utils/youtubeUrl';

const props = defineProps({
  highlightsUrl: { type: String, default: '' },
});

const { t } = useI18n();

const watchUrl = computed(() => {
  const url = buildYoutubeWatchUrl(props.highlightsUrl);
  return url || '';
});
</script>

<style scoped>
.match-highlights-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  white-space: nowrap;
}

.match-highlights-link:hover {
  text-decoration: underline;
}

.match-highlights-link__icon {
  font-size: 0.7rem;
}
</style>
