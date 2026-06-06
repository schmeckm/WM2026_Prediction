import { ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';

export function useMatchPreview(matchIdSource) {
  const { t } = useI18n();
  const content = ref('');
  const disclaimer = ref('');
  const loading = ref(false);
  const error = ref('');
  const cached = ref(false);

  async function loadPreview({ regenerate = false } = {}) {
    const matchId = unref(matchIdSource);
    if (!matchId) return;

    loading.value = true;
    error.value = '';
    try {
      const { data } = await api.post(`/ai/match-preview/${matchId}`, { regenerate });
      content.value = data.content || '';
      disclaimer.value = data.disclaimer || '';
      cached.value = !!data.cached;
    } catch (err) {
      content.value = '';
      disclaimer.value = '';
      error.value = err.response?.data?.error || t('ai.previewUnavailable');
    } finally {
      loading.value = false;
    }
  }

  function resetPreview() {
    content.value = '';
    disclaimer.value = '';
    error.value = '';
    cached.value = false;
    loading.value = false;
  }

  return {
    content,
    disclaimer,
    loading,
    error,
    cached,
    loadPreview,
    resetPreview,
  };
}
