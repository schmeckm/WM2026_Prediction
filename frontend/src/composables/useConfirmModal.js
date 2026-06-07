import { ref } from 'vue';

export function useConfirmModal() {
  const confirmState = ref({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    danger: false,
    action: null,
  });

  function openConfirm({
    title, message, confirmLabel = '', danger = false, action,
  }) {
    confirmState.value = {
      open: true, title, message, confirmLabel, danger, action,
    };
  }

  function closeConfirm() {
    confirmState.value = { ...confirmState.value, open: false, action: null };
  }

  function onConfirm() {
    const action = confirmState.value.action;
    closeConfirm();
    action?.();
  }

  return {
    confirmState, openConfirm, closeConfirm, onConfirm,
  };
}
