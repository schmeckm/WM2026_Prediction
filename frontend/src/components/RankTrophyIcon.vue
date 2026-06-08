<template>
  <span
    class="rank-trophy"
    :style="{ '--trophy-color': color }"
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" role="img">
      <path
        class="trophy-shape"
        d="M7 2h10v6c0 2.76-2.24 5-5 5s-5-2.24-5-5V2z"
      />
      <path
        class="trophy-shape"
        d="M5 3.5a1.75 1.75 0 0 0 0 3.5H7V3.5H5zm12 0V7h2a1.75 1.75 0 0 0 0-3.5H17z"
      />
      <path
        class="trophy-shape"
        d="M10 13h4v5h-4z"
      />
      <path
        class="trophy-shape"
        d="M5 19h14v3H5z"
      />
    </svg>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  rank: { type: [Number, String], required: true },
});

const COLORS = {
  1: '#ffd700',
  2: '#c0c0c0',
  3: '#cd7f32',
};

const color = computed(() => COLORS[Number(props.rank)] || COLORS[1]);
</script>

<style scoped>
.rank-trophy {
  display: inline-flex;
  align-items: center;
  line-height: 0;
  flex-shrink: 0;
}

.rank-trophy svg {
  width: 1.375rem;
  height: 1.375rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
}

.trophy-shape {
  fill: var(--trophy-color);
}
</style>
