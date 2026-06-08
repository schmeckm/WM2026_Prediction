import { ref } from 'vue';

const MIN_ZOOM = 0.55;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

export function useBracketZoom(initial = 1) {
  const zoom = ref(initial);

  function zoomIn() {
    zoom.value = Math.min(MAX_ZOOM, Math.round((zoom.value + ZOOM_STEP) * 10) / 10);
  }

  function zoomOut() {
    zoom.value = Math.max(MIN_ZOOM, Math.round((zoom.value - ZOOM_STEP) * 10) / 10);
  }

  function resetZoom() {
    zoom.value = 1;
  }

  function fitZoom() {
    zoom.value = 0.75;
  }

  return {
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitZoom,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
  };
}
