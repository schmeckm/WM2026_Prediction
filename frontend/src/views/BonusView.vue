<template>
  <div>
    <div class="page-header page-header--bonus">
      <div>
        <h1>{{ t('bonus.title') }}</h1>
        <p class="text-muted bonus-header-hint">{{ t('bonus.headerHint') }}</p>
      </div>
      <router-link to="/help" class="btn btn-secondary btn-sm">{{ t('bonus.rulesLink') }}</router-link>
    </div>
    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <template v-else>
      <BonusQuestionCard v-for="q in questions" :key="q.id" :question="q" @saved="load" />
      <EmptyState
        v-if="questions.length === 0"
        icon="🎯"
        :message="t('bonus.empty')"
        :action-label="t('bonus.rulesLink')"
        action-to="/help"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ErrorState from '../components/ErrorState.vue';
import BonusQuestionCard from '../components/BonusQuestionCard.vue';
import EmptyState from '../components/EmptyState.vue';

const { t } = useI18n();
const questions = ref([]);
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/bonus-questions');
    questions.value = data;
  } catch (err) {
    error.value = err.response?.data?.error || t('bonus.loadFailed');
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.page-header--bonus {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.bonus-header-hint {
  margin: 0.25rem 0 0;
  max-width: 36rem;
}
</style>
