import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { registerSW } from 'virtual:pwa-register';
import App from './App.vue';
import router from './router';
import i18n from './i18n';
import './styles/main.css';
import { useThemeStore } from './stores/themeStore';
import { initSentry } from './sentry';

registerSW({ immediate: true });

const CHUNK_RELOAD_KEY = 'chunk-reload-attempts';
const MAX_CHUNK_RELOADS = 3;

async function recoverFromStaleBuild() {
  const attempts = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
  if (attempts >= MAX_CHUNK_RELOADS) return;

  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(attempts + 1));

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  const url = new URL(window.location.href);
  url.searchParams.set('_cb', String(Date.now()));
  window.location.replace(url.toString());
}

function isChunkLoadError(message = '') {
  return message.includes('Failed to fetch dynamically imported module')
    || message.includes('Importing a module script failed');
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  recoverFromStaleBuild();
});

router.onError((error) => {
  if (isChunkLoadError(error?.message || '')) {
    recoverFromStaleBuild();
  }
});

const app = createApp(App);
const pinia = createPinia();
initSentry(app, router);
app.use(pinia);
app.use(i18n);
app.use(router);
useThemeStore().initTheme();
app.mount('#app');
sessionStorage.removeItem(CHUNK_RELOAD_KEY);
