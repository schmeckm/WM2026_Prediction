<template>
  <div>
    <div class="page-header">
      <div>
        <h1>⚡ {{ t('adminPages.resultsCopilot.title') }}</h1>
        <p class="text-muted">{{ t('adminPages.resultsCopilot.subtitle') }}</p>
      </div>
      <router-link to="/admin/results" class="btn btn-secondary btn-sm">
        {{ t('adminPages.resultsCopilot.fullResultsLink') }}
      </router-link>
    </div>

    <div class="card">
      <div class="card-body">
        <AdminResultsCopilot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import AdminResultsCopilot from '../../components/AdminResultsCopilot.vue';

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
