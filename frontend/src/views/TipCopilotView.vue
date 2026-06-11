<template>
  <div>
    <div class="page-header">
      <div>
        <h1>⚡ {{ t('tipCopilot.title') }}</h1>
        <p class="text-muted">{{ t('tipCopilot.subtitle') }}</p>
      </div>
      <router-link to="/matches" class="btn btn-secondary btn-sm">
        {{ t('tipCopilot.backToMatches') }}
      </router-link>
    </div>

    <div class="card">
      <div class="card-body">
        <TipCopilot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import TipCopilot from '../components/TipCopilot.vue';

const { t } = useI18n();
</script>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header p {
  margin: 0.25rem 0 0;
}
</style>

