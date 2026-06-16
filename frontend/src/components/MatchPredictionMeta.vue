<template>
  <div v-if="hasDisplayableResult(match) || match.marketOdds?.probabilities" class="match-tip-meta">
    <div v-if="hasDisplayableResult(match)" class="match-tip-meta__line">
      {{ t('matches.actualResult') }}: {{ displayMatchScore(match).home }} : {{ displayMatchScore(match).away }}
    </div>
    <div v-if="match.marketOdds?.probabilities" class="match-tip-meta__line">
      {{ formatMarketProbabilities(match, t) }}
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { hasDisplayableResult, displayMatchScore, formatMarketProbabilities } from '../composables/useMatchExtras';

defineProps({
  match: { type: Object, required: true },
});

const { t } = useI18n();
</script>

<style scoped>
.match-tip-meta {
  margin-top: 0.35rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.35;
}

.match-tip-meta__line + .match-tip-meta__line {
  margin-top: 0.15rem;
}
</style>
