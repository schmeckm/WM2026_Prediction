<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="cancel">
      <div
        class="modal confirm-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div class="modal-header">
          <h3 :id="titleId">{{ title }}</h3>
          <button
            type="button"
            class="modal-close"
            :aria-label="t('common.close')"
            @click="cancel"
          >
            &times;
          </button>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="cancel">
            {{ cancelLabel || t('common.cancel') }}
          </button>
          <button
            type="button"
            :class="['btn', danger ? 'btn-danger' : 'btn-primary']"
            @click="confirm"
          >
            {{ confirmLabel || t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: '' },
  cancelLabel: { type: String, default: '' },
  danger: { type: Boolean, default: false },
});

const emit = defineEmits(['confirm', 'cancel']);

const { t } = useI18n();
const titleId = `confirm-modal-title-${Math.random().toString(36).slice(2, 9)}`;

function confirm() {
  emit('confirm');
}

function cancel() {
  emit('cancel');
}

function onKeydown(event) {
  if (event.key === 'Escape' && props.open) cancel();
}

onMounted(() => {
  globalThis.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  globalThis.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.confirm-modal {
  max-width: 420px;
}

.confirm-modal .modal-body p {
  margin: 0;
}
</style>
