<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="cancel">
      <div
        ref="modalRef"
        class="modal confirm-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @keydown="onTabKeydown"
      >
        <div class="modal-header">
          <h3 :id="titleId">{{ title }}</h3>
          <button
            ref="closeButtonRef"
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
          <button ref="cancelButtonRef" type="button" class="btn btn-secondary" @click="cancel">
            {{ cancelLabel || t('common.cancel') }}
          </button>
          <button
            ref="confirmButtonRef"
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
import {
  ref, watch, nextTick, onMounted, onUnmounted,
} from 'vue';
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
const modalRef = ref(null);
const closeButtonRef = ref(null);
const cancelButtonRef = ref(null);
const confirmButtonRef = ref(null);

function focusableElements() {
  return [closeButtonRef.value, cancelButtonRef.value, confirmButtonRef.value].filter(Boolean);
}

function confirm() {
  emit('confirm');
}

function cancel() {
  emit('cancel');
}

function onKeydown(event) {
  if (event.key === 'Escape' && props.open) cancel();
}

function onTabKeydown(event) {
  if (event.key !== 'Tab' || !props.open) return;
  const elements = focusableElements();
  if (elements.length === 0) return;
  const first = elements[0];
  const last = elements[elements.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      (props.danger ? confirmButtonRef.value : cancelButtonRef.value)?.focus();
    });
  }
});

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
