import { ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';

export function useMatchPreview(matchIdSource) {
  const { t, locale } = useI18n();
  const content = ref('');
  const disclaimer = ref('');
  const loading = ref(false);
  const error = ref('');
  const cached = ref(false);

  const loadingRequest = ref(null);

  async function loadPreview({ regenerate = false } = {}) {
    const matchId = unref(matchIdSource);
    if (!matchId || loadingRequest.value === matchId) return;

    loadingRequest.value = matchId;
    loading.value = true;
    error.value = '';
    try {
      const { data } = await api.post(`/ai/match-preview/${matchId}`, {
        regenerate,
        language: locale.value,
      }, {
        timeout: 90000,
      });
      if (data.unavailable) {
        content.value = '';
        disclaimer.value = data.disclaimer || '';
        error.value = data.error || t('ai.previewUnavailable');
        return;
      }
      content.value = data.content || '';
      disclaimer.value = data.disclaimer || '';
      cached.value = !!data.cached;
    } catch (err) {
      content.value = '';
      disclaimer.value = '';
      error.value = err.response?.data?.error || t('ai.previewUnavailable');
    } finally {
      loading.value = false;
      if (loadingRequest.value === matchId) {
        loadingRequest.value = null;
      }
    }
  }

  function resetPreview() {
    content.value = '';
    disclaimer.value = '';
    error.value = '';
    cached.value = false;
    loading.value = false;
    loadingRequest.value = null;
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
