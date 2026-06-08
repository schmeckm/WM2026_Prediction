<template>
  <div v-if="canInstall" class="pwa-install-banner" role="region" :aria-label="t('pwa.installTitle')">
    <div class="pwa-install-banner-text">
      <strong>{{ t('pwa.installTitle') }}</strong>
      <p>{{ t('pwa.installHint') }}</p>
    </div>
    <div class="pwa-install-banner-actions">
      <button type="button" class="btn btn-primary btn-sm" @click="install">
        {{ t('pwa.installAction') }}
      </button>
      <button type="button" class="btn btn-secondary btn-sm" @click="dismiss">
        {{ t('pwa.installDismiss') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { usePwaInstall } from '../composables/usePwaInstall';

const { t } = useI18n();
const { canInstall, install, dismiss } = usePwaInstall();
</script>

<style scoped>
.pwa-install-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 0.875rem 1rem;
  border: 1px solid rgba(0, 255, 127, 0.25);
  border-radius: var(--radius);
  background: var(--color-primary-soft);
}

.pwa-install-banner-text strong {
  display: block;
  margin-bottom: 0.2rem;
}

.pwa-install-banner-text p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.pwa-install-banner-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
