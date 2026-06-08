import { ref, onMounted, onUnmounted } from 'vue';

const DISMISS_KEY = 'pwa-install-dismissed';

export function usePwaInstall() {
  const canInstall = ref(false);
  const isInstalled = ref(false);
  let deferredPrompt = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }

  function isDismissed() {
    return localStorage.getItem(DISMISS_KEY) === '1';
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    canInstall.value = false;
  }

  async function install() {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    canInstall.value = false;
    return outcome === 'accepted';
  }

  function onBeforeInstallPrompt(event) {
    event.preventDefault();
    deferredPrompt = event;
    if (!isDismissed() && !isStandalone()) {
      canInstall.value = true;
    }
  }

  function onAppInstalled() {
    isInstalled.value = true;
    canInstall.value = false;
    deferredPrompt = null;
  }

  onMounted(() => {
    isInstalled.value = isStandalone();
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.removeEventListener('appinstalled', onAppInstalled);
  });

  return {
    canInstall,
    isInstalled,
    install,
    dismiss,
  };
}
