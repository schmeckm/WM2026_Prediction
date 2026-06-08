import { ref, onMounted, onUnmounted } from 'vue';

export function useAsyncData(fetcher, { immediate = true } = {}) {
  const data = ref(null);
  const loading = ref(immediate);
  const error = ref(null);
  let controller;

  async function execute(...args) {
    controller?.abort();
    controller = new AbortController();
    loading.value = true;
    error.value = null;
    try {
      const result = await fetcher(controller.signal, ...args);
      if (!controller.signal.aborted) {
        data.value = result;
      }
      return result;
    } catch (err) {
      if (err?.name !== 'AbortError' && err?.code !== 'ERR_CANCELED') {
        error.value = err;
      }
      throw err;
    } finally {
      if (!controller.signal.aborted) {
        loading.value = false;
      }
    }
  }

  if (immediate) {
    onMounted(() => { execute().catch(() => {}); });
  }

  onUnmounted(() => controller?.abort());

  return { data, loading, error, refresh: execute };
}

export function getErrorMessage(err, fallback = '') {
  return err?.response?.data?.error || err?.message || fallback;
}
