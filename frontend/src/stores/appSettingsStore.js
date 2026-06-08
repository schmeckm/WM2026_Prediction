import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export const useAppSettingsStore = defineStore('appSettings', () => {
  const loaded = ref(false);
  const prizesEnabled = ref(false);
  const prizes = ref([]);

  const showPrizesNav = computed(() => prizesEnabled.value);

  async function load() {
    try {
      const { data } = await api.get('/settings');
      prizesEnabled.value = !!data.prizesEnabled;
      prizes.value = Array.isArray(data.prizes) ? data.prizes : [];
    } catch {
      prizesEnabled.value = false;
      prizes.value = [];
    } finally {
      loaded.value = true;
    }
  }

  function applySettings(data) {
    if (data.prizesEnabled !== undefined) prizesEnabled.value = !!data.prizesEnabled;
    if (Array.isArray(data.prizes)) prizes.value = data.prizes;
  }

  return {
    loaded,
    prizesEnabled,
    prizes,
    showPrizesNav,
    load,
    applySettings,
  };
});
