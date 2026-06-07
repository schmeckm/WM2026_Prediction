<template>
  <div class="error-state alert alert-error" role="alert">
    <p>{{ message }}</p>
    <button v-if="showRetry" type="button" class="btn btn-secondary btn-sm" @click="$emit('retry')">
      {{ retryLabel || t('common.retry') }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  message: { type: String, required: true },
  showRetry: { type: Boolean, default: true },
  retryLabel: { type: String, default: '' },
});

defineEmits(['retry']);

const { t } = useI18n();
</script>

<style scoped>
.error-state {
  margin-bottom: 1rem;
}

.error-state p {
  margin: 0 0 0.75rem;
}
</style>
