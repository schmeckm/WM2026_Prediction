<template>
  <div class="skeleton-card" aria-hidden="true">
    <div class="skeleton-line skeleton-line--title" />
    <div class="skeleton-line skeleton-line--body" />
    <div class="skeleton-line skeleton-line--body skeleton-line--short" />
  </div>
</template>

<style scoped>
.skeleton-card {
  padding: 1.25rem;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.skeleton-line {
  height: 0.875rem;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--color-bg) 25%,
    var(--color-surface-elevated, var(--color-surface)) 50%,
    var(--color-bg) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.2s ease-in-out infinite;
  margin-bottom: 0.65rem;
}

.skeleton-line--title {
  width: 45%;
  height: 1.125rem;
}

.skeleton-line--short {
  width: 60%;
  margin-bottom: 0;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line {
    animation: none;
  }
}
</style>
