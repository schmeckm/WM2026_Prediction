import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';
import { getStoredLocale, normalizeLocale, setStoredLocale } from '../i18n';
import { useLocaleStore } from './localeStore';
import { isProfileWmComplete } from '../composables/useProfileCompletion';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const refreshToken = ref(localStorage.getItem('refreshToken') || null);
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const profileImageCache = ref(0);
  const profileLoginReminderDue = ref(false);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const fullName = computed(() => {
    if (!user.value) return '';
    return `${user.value.firstName} ${user.value.lastName}`;
  });

  function bumpProfileImageCache() {
    profileImageCache.value = Date.now();
  }

  function setAuth(newToken, newUser, newRefreshToken = null) {
    token.value = newToken;
    user.value = newUser;
    profileImageCache.value = newUser?.imageUrl ? Date.now() : 0;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (newRefreshToken) {
      refreshToken.value = newRefreshToken;
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    const localeStore = useLocaleStore();
    const userLocale = normalizeLocale(newUser?.language || getStoredLocale());
    setStoredLocale(userLocale);
    localeStore.applyLocale(userLocale);
    profileLoginReminderDue.value = !isProfileWmComplete(newUser);
  }

  function clearLocalAuth() {
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    profileImageCache.value = 0;
    profileLoginReminderDue.value = false;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  function logout() {
    clearLocalAuth();
  }

  async function logoutAsync() {
    const currentToken = token.value;
    const currentRefreshToken = refreshToken.value;
    clearLocalAuth();
    if (currentToken) {
      try {
        await api.post('/auth/logout', { refreshToken: currentRefreshToken }, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch {
        // ignore
      }
    }
  }

  async function login(email, password, totpCode = null) {
    const { data } = await api.post('/auth/login', { email, password, totpCode });
    setAuth(data.token, data.user, data.refreshToken);
    return data;
  }

  async function register(formData) {
    const { data } = await api.post('/auth/register', formData);
    if (!data.requiresVerification && data.token) {
      setAuth(data.token, data.user, data.refreshToken);
    }
    return data;
  }

  async function resendVerification(email) {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data;
  }

  async function verifyEmail(token) {
    const { data } = await api.post('/auth/verify-email', { token });
    setAuth(data.token, data.user, data.refreshToken);
    return data;
  }

  async function forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  }

  async function resetPassword(token, password) {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  }

  async function fetchMe() {
    const { data } = await api.get('/auth/me');
    user.value = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    useLocaleStore().syncFromUser(data.user);
    return data.user;
  }

  async function updateProfile(userId, payload) {
    const { data } = await api.put(`/users/${userId}`, payload);
    syncUser(data);
    if (payload.language) {
      useLocaleStore().applyLocale(payload.language);
    }
    return data;
  }

  function syncUser(updatedUser, options = {}) {
    user.value = updatedUser;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    useLocaleStore().syncFromUser(updatedUser);
    if (options.bumpImage) {
      bumpProfileImageCache();
    }
  }

  async function deleteAccount(password) {
    const payload = password ? { password } : {};
    await api.delete('/users/me', { data: payload });
    clearLocalAuth();
  }

  async function fetchAuthProviders() {
    const { data } = await api.get('/auth/providers');
    return data;
  }

  function loginWithGoogle() {
    const locale = useLocaleStore().locale;
    window.location.href = `/api/auth/google?language=${encodeURIComponent(locale)}`;
  }

  async function exchangeSsoCode(code) {
    const { data } = await api.post('/auth/exchange', { code });
    setAuth(data.token, data.user, data.refreshToken);
    return data;
  }

  async function completeSsoRegistration(code, teamId) {
    const { data } = await api.post('/auth/complete-sso', { code, teamId });
    setAuth(data.token, data.user, data.refreshToken);
    return data;
  }

  async function setupTwoFactor() {
    const { data } = await api.post('/auth/2fa/setup');
    return data;
  }

  async function enableTwoFactor(code) {
    const { data } = await api.post('/auth/2fa/enable', { code });
    await fetchMe();
    return data;
  }

  async function disableTwoFactor(code) {
    const { data } = await api.post('/auth/2fa/disable', { code });
    await fetchMe();
    return data;
  }

  return {
    token,
    refreshToken,
    user,
    profileImageCache,
    profileLoginReminderDue,
    isAuthenticated,
    isAdmin,
    fullName,
    login,
    register,
    resendVerification,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logout,
    logoutAsync,
    fetchMe,
    updateProfile,
    syncUser,
    setAuth,
    deleteAccount,
    fetchAuthProviders,
    loginWithGoogle,
    exchangeSsoCode,
    completeSsoRegistration,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
  };
});
