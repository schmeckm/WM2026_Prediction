<template>
  <div class="loading-spinner" role="status" aria-live="polite" :aria-label="label || t('common.loading')">
    <div class="spinner" aria-hidden="true"></div>
    <span class="visually-hidden">{{ label || t('common.loading') }}</span>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  label: { type: String, default: '' },
});

const { t } = useI18n();
</script>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
