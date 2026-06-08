<template>
  <div class="match-card-skeleton card" aria-hidden="true">
    <div class="match-card-skeleton-header">
      <span class="skeleton-line skeleton-line--sm" />
      <span class="skeleton-line skeleton-line--xs" />
    </div>
    <div class="match-card-skeleton-teams">
      <span class="skeleton-line skeleton-line--team" />
      <span class="skeleton-line skeleton-line--score" />
      <span class="skeleton-line skeleton-line--team" />
    </div>
    <div class="match-card-skeleton-meta">
      <span class="skeleton-line skeleton-line--md" />
      <span class="skeleton-line skeleton-line--sm" />
    </div>
  </div>
</template>

<style scoped>
.match-card-skeleton {
  padding: 1rem;
  margin-bottom: 0.75rem;
  pointer-events: none;
}

.match-card-skeleton-header,
.match-card-skeleton-teams,
.match-card-skeleton-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.match-card-skeleton-teams {
  margin: 1rem 0;
}

.skeleton-line {
  display: block;
  height: 0.75rem;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    rgba(255, 255, 255, 0.06) 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.2s ease-in-out infinite;
}

.skeleton-line--xs { width: 3rem; }
.skeleton-line--sm { width: 5rem; }
.skeleton-line--md { width: 8rem; }
.skeleton-line--team { flex: 1; max-width: 7rem; height: 1rem; }
.skeleton-line--score { width: 2.5rem; height: 1.25rem; }

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
