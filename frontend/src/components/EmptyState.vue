<template>
  <div class="empty-state" role="status">
    <div v-if="icon" class="empty-icon" aria-hidden="true">{{ icon }}</div>
    <p v-if="title" class="empty-state-title">{{ title }}</p>
    <p class="empty-state-message">{{ message }}</p>
    <router-link
      v-if="actionTo"
      :to="actionTo"
      class="btn btn-primary btn-sm mt-2"
    >
      {{ actionLabel }}
    </router-link>
    <button
      v-else-if="actionLabel"
      type="button"
      class="btn btn-primary btn-sm mt-2"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '' },
  title: { type: String, default: '' },
  message: { type: String, required: true },
  actionLabel: { type: String, default: '' },
  actionTo: { type: [String, Object], default: '' },
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
