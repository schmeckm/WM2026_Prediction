import { ref, onMounted, onUnmounted } from 'vue';

export function useFullscreen(targetRef) {
  const isFullscreen = ref(false);

  const supported = typeof document !== 'undefined'
    && typeof document.documentElement?.requestFullscreen === 'function';

  function syncState() {
    isFullscreen.value = document.fullscreenElement === targetRef.value;
  }

  async function enter() {
    if (!supported || !targetRef.value) return;
    await targetRef.value.requestFullscreen();
  }

  async function exit() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }

  async function toggle() {
    if (isFullscreen.value) {
      await exit();
    } else {
      await enter();
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', syncState);
  });

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', syncState);
    if (document.fullscreenElement === targetRef.value) {
      document.exitFullscreen().catch(() => {});
    }
  });

  return { isFullscreen, supported, toggle, enter, exit };
}
