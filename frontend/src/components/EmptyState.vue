<template>
  <div class="empty-state" role="status">
    <p v-if="title" class="empty-state-title">{{ title }}</p>
    <p class="empty-state-message">{{ message }}</p>
    <button v-if="actionLabel" type="button" class="btn btn-primary btn-sm mt-2" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  message: { type: String, required: true },
  actionLabel: { type: String, default: '' },
});

defineEmits(['action']);
</script>

<style scoped>
.empty-state-title {
  font-weight: 700;
  color: var(--sapTitleColor);
  margin-bottom: 0.35rem;
}
</style>
