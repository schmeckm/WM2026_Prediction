<template>
  <div>
    <div class="page-header"><h1>{{ t('bonus.title') }}</h1></div>
    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <template v-else>
      <BonusQuestionCard v-for="q in questions" :key="q.id" :question="q" @saved="load" />
      <div v-if="questions.length === 0" class="empty-state">
        <div class="empty-icon">🎯</div>
        <p>{{ t('bonus.empty') }}</p>
      </div>
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
