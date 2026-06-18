import { defineStore } from 'pinia';
import { ref } from 'vue';
import { applyPortalAccent } from '../utils/applyPortalAccent';
import { normalizePortalAccent } from '../utils/portalAccentColors';
import { useThemeStore } from './themeStore';

const STORAGE_KEY = 'portalAccent';

function readStoredAccent() {
  return normalizePortalAccent(localStorage.getItem(STORAGE_KEY) || 'green');
}

export const usePortalAccentStore = defineStore('portalAccent', () => {
  const accent = ref(readStoredAccent());

  function reapply() {
    const theme = useThemeStore().theme;
    applyPortalAccent(accent.value, theme);
  }

  function preview(accentId) {
    const theme = useThemeStore().theme;
    applyPortalAccent(accentId, theme);
  }

  function apply(accentId) {
    accent.value = normalizePortalAccent(accentId);
    localStorage.setItem(STORAGE_KEY, accent.value);
    reapply();
  }

  function initFromUser(user) {
    const value = normalizePortalAccent(user?.portalAccent || readStoredAccent());
    accent.value = value;
    localStorage.setItem(STORAGE_KEY, value);
    reapply();
  }

  function reset() {
    accent.value = 'green';
    localStorage.removeItem(STORAGE_KEY);
    reapply();
  }

  function init() {
    reapply();
  }

  return {
    accent,
    apply,
    preview,
    reapply,
    initFromUser,
    reset,
    init,
  };
});
