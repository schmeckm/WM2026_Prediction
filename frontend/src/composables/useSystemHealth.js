import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';

const POLL_INTERVAL_MS = 30000;

export function useSystemHealth() {
  const frontendAiEnabled = import.meta.env.VITE_AI_FEATURES_ENABLED !== 'false';
  const { t } = useI18n();

  const backendState = ref('checking');
  const frontendState = ref('checking');
  const aiBackendState = ref('checking');
  const aiFrontendState = ref(frontendAiEnabled ? 'online' : 'offline');
  const version = ref(import.meta.env.VITE_APP_VERSION || null);
  const expandedKey = ref(null);

  const backendDetail = ref('');
  const aiBackendDetail = ref('');
  const aiFrontendDetail = ref('');

  function stateText(state, type = 'connection') {
    if (state === 'checking') return t('systemHealth.checking');
    if (type === 'ai') {
      return state === 'online' ? t('systemHealth.aiActive') : t('systemHealth.aiInactive');
    }
    return state === 'online' ? t('systemHealth.online') : t('systemHealth.offline');
  }

  function aiReasonDetail(reason) {
    if (reason === 'disabled') return t('systemHealth.detailAiDisabled');
    if (reason === 'no_api_key') return t('systemHealth.detailAiNoApiKey');
    return '';
  }

  const items = computed(() => [
    {
      key: 'backend',
      label: t('systemHealth.backend'),
      state: backendState.value,
      text: stateText(backendState.value),
      detail: backendDetail.value,
      clickable: backendState.value === 'offline' && !!backendDetail.value,
    },
    {
      key: 'frontend',
      label: t('systemHealth.frontend'),
      state: frontendState.value,
      text: stateText(frontendState.value),
      detail: '',
      clickable: false,
    },
    {
      key: 'aiBackend',
      label: t('systemHealth.aiBackend'),
      state: aiBackendState.value,
      text: stateText(aiBackendState.value, 'ai'),
      detail: aiBackendDetail.value,
      clickable: aiBackendState.value === 'offline' && !!aiBackendDetail.value,
    },
    {
      key: 'aiFrontend',
      label: t('systemHealth.aiFrontend'),
      state: aiFrontendState.value,
      text: stateText(aiFrontendState.value, 'ai'),
      detail: aiFrontendDetail.value,
      clickable: aiFrontendState.value === 'offline' && !!aiFrontendDetail.value,
    },
  ]);

  const expandedItem = computed(() => {
    if (!expandedKey.value) return null;
    return items.value.find((item) => item.key === expandedKey.value) || null;
  });

  function toggleDetail(key) {
    const item = items.value.find((entry) => entry.key === key);
    if (!item?.clickable) return;
    expandedKey.value = expandedKey.value === key ? null : key;
  }

  function isTransientHealthError(error) {
    const status = error?.response?.status;
    return !status || status === 502 || status === 503 || status === 504 || error?.code === 'ECONNABORTED';
  }

  async function fetchHealth() {
    return api.get('/health', { timeout: 8000 });
  }

  async function checkHealth() {
    frontendState.value = 'online';
    backendDetail.value = '';
    aiBackendDetail.value = '';
    aiFrontendDetail.value = frontendAiEnabled
      ? ''
      : t('systemHealth.detailAiFrontendDisabled');

    try {
      let response;
      try {
        response = await fetchHealth();
      } catch (firstError) {
        if (!isTransientHealthError(firstError)) throw firstError;
        await new Promise((resolve) => { setTimeout(resolve, 2500); });
        response = await fetchHealth();
      }

      const { data } = response;
      backendState.value = data?.status === 'ok' ? 'online' : 'offline';
      if (backendState.value === 'offline') {
        backendDetail.value = data?.reason === 'database_unavailable'
          ? t('systemHealth.detailDatabaseUnavailable')
          : t('systemHealth.detailBackendOffline');
      }

      aiBackendState.value = data?.ai?.active ? 'online' : 'offline';
      if (aiBackendState.value === 'offline') {
        aiBackendDetail.value = aiReasonDetail(data?.ai?.reason) || t('systemHealth.detailAiInactive');
      }

      if (data?.version) version.value = data.version;
    } catch {
      backendState.value = 'offline';
      backendDetail.value = t('systemHealth.detailBackendOffline');
      aiBackendState.value = 'offline';
      aiBackendDetail.value = t('systemHealth.detailBackendOfflineAi');
    }

    if (expandedKey.value) {
      const stillClickable = items.value.some(
        (item) => item.key === expandedKey.value && item.clickable,
      );
      if (!stillClickable) expandedKey.value = null;
    }
  }

  let intervalId;

  onMounted(() => {
    checkHealth();
    intervalId = setInterval(checkHealth, POLL_INTERVAL_MS);
  });

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return { items, version, expandedItem, toggleDetail };
}
