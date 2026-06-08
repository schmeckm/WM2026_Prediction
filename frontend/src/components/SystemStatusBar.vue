<template>
  <footer class="system-status-bar" role="status" :aria-label="t('systemHealth.title')">
    <div
      v-if="expandedItem"
      class="system-status-detail"
      role="note"
    >
      <strong>{{ expandedItem.label }}:</strong> {{ expandedItem.detail }}
    </div>
    <div class="system-status-bar-inner">
      <div class="system-status-items">
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          class="system-status-item"
          :class="[item.state, { clickable: item.clickable, expanded: expandedItem?.key === item.key }]"
          :disabled="!item.clickable"
          :aria-expanded="item.clickable ? expandedItem?.key === item.key : undefined"
          :title="item.clickable ? t('systemHealth.clickForDetails') : undefined"
          @click="toggleDetail(item.key)"
        >
          <span class="system-status-label">{{ item.label }}</span>
          <span class="system-status-dot" aria-hidden="true"></span>
          <span class="system-status-value">{{ item.text }}</span>
        </button>
      </div>
      <span v-if="version" class="system-status-version">v{{ version }}</span>
    </div>
  </footer>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useSystemHealth } from '../composables/useSystemHealth';

const { t } = useI18n();
const { items, version, expandedItem, toggleDetail } = useSystemHealth();
</script>

<style scoped>
.system-status-bar {
  flex-shrink: 0;
  margin-top: auto;
  width: 100%;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 0.625rem 2rem;
}

.system-status-detail {
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  background: rgba(220, 53, 69, 0.08);
  border: 1px solid rgba(220, 53, 69, 0.2);
  color: var(--color-text);
  font-size: 0.75rem;
  line-height: 1.4;
}

.system-status-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  width: 100%;
}

.system-status-items {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex: 1;
  min-width: 0;
}

.system-status-version {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.system-status-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  flex: 1;
  min-width: 0;
  font-size: 0.75rem;
  white-space: nowrap;
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  color: inherit;
}

.system-status-item.clickable {
  cursor: pointer;
}

.system-status-item.clickable:hover .system-status-value,
.system-status-item.clickable.expanded .system-status-value {
  text-decoration: underline;
}

.system-status-item:disabled {
  cursor: default;
}

.system-status-label {
  font-weight: 600;
  color: var(--color-text-muted);
}

.system-status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.system-status-value {
  font-weight: 600;
}

.system-status-item.checking .system-status-dot {
  background: var(--color-text-muted);
  animation: pulse 1.2s ease-in-out infinite;
}

.system-status-item.checking .system-status-value {
  color: var(--color-text-muted);
}

.system-status-item.online .system-status-dot {
  background: var(--color-success);
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.system-status-item.online .system-status-value {
  color: var(--color-success);
}

.system-status-item.offline .system-status-dot {
  background: var(--color-danger);
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

.system-status-item.offline .system-status-value {
  color: var(--color-danger);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@media (max-width: 768px) {
  .system-status-bar {
    padding: 0.625rem 1rem;
  }

  .system-status-bar-inner {
    gap: 0.75rem;
  }

  .system-status-items {
    gap: 0.75rem;
  }

  .system-status-version {
    font-size: 0.65rem;
  }

  .system-status-item {
    font-size: 0.65rem;
    gap: 0.25rem;
  }

  .system-status-label {
    display: none;
  }
}
</style>
