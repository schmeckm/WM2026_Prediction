import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { getStoredLocale } from '../i18n';
import i18n from '../i18n';
import { isAuthFlowPath } from '../utils/authFlow';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise = null;
let lastRateLimitToastAt = 0;

async function tryRefreshToken() {
  const authStore = useAuthStore();
  if (!authStore.refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = axios.post('/api/auth/refresh', {
      refreshToken: authStore.refreshToken,
    }).then((response) => {
      authStore.setAuth(response.data.token, response.data.user, response.data.refreshToken);
      return true;
    }).catch(() => false).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  const locale = i18n.global.locale.value || authStore.user?.language || getStoredLocale();
  config.headers['X-Language'] = locale;

  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (isFormData) {
    delete config.headers['Content-Type'];
  } else if (config.method === 'get') {
    config.params = { ...config.params, lang: locale };
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      const now = Date.now();
      if (now - lastRateLimitToastAt > 30_000) {
        lastRateLimitToastAt = now;
        const toastStore = useToastStore();
        toastStore.warning(i18n.global.t('common.tooManyRequests'));
      }
    }

    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest = /\/auth\/(login|register|refresh|exchange|sso-pending|complete-sso)(\/|$|\?)/.test(requestUrl);

    if (error.response?.status === 401 && !isAuthRequest && !originalRequest?._retry) {
      originalRequest._retry = true;
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const authStore = useAuthStore();
        originalRequest.headers.Authorization = `Bearer ${authStore.token}`;
        return api(originalRequest);
      }

      const authStore = useAuthStore();
      const errorText = error.response?.data?.error || '';
      const isSessionExpired = /session|expired|abgelaufen|Sitzung|sesión|invalidToken|refresh/i.test(errorText);
      if (isAuthFlowPath()) {
        return Promise.reject(error);
      }
      if (isSessionExpired) {
        const toastStore = useToastStore();
        toastStore.warning(i18n.global.t('auth.sessionExpired'));
      }
      authStore.logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;

export async function downloadAuthenticatedFile(url, filename = 'download.csv') {
  const response = await api.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
