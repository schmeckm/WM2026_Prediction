<template>
  <div class="app-brand" :class="{ compact, centered }">
    <div
      class="app-brand-icon"
      :class="{ 'app-brand-icon--mark': iconVariant === 'mark' }"
      aria-hidden="true"
    >
      <svg
        v-if="iconVariant === 'mark'"
        class="app-brand-logo app-brand-logo--mark"
        viewBox="-92 -88 138 228"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="currentColor"
          d="m 0,0 h -85.232 c -23.538,0 -42.617,-19.08 -42.617,-42.616 v -42.616 c 0,-23.537 19.079,-42.617 42.617,-42.617 H 0 c 23.537,0 42.616,19.08 42.616,42.617 0,23.536 -19.079,42.616 -42.616,42.616 H 42.616 C 42.616,-19.08 23.537,0 0,0 m 0,135.151 h -85.232 c -23.538,0 -42.617,-19.08 -42.617,-42.616 h 42.617 c -23.538,0 -42.617,-19.079 -42.617,-42.616 V 7.302 H 42.616 V 49.919 H 0 c 23.537,0 42.616,19.08 42.616,42.616 0,23.536 -19.079,42.616 -42.616,42.616"
        />
      </svg>
      <img
        v-else
        src="/wm2026-emblem.svg"
        :alt="t('brand.title')"
        class="app-brand-logo"
        width="454"
        height="701"
      />
    </div>
    <div v-if="showTitle" class="app-brand-copy">
      <strong>{{ title || t('brand.title') }}</strong>
      <span v-if="subtitle">{{ subtitle }}</span>
      <span v-else-if="showSubtitle">{{ t('brand.subtitle') }}</span>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  showTitle: { type: Boolean, default: true },
  showSubtitle: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  centered: { type: Boolean, default: false },
  iconVariant: {
    type: String,
    default: 'emblem',
    validator: (value) => ['emblem', 'mark'].includes(value),
  },
});

const { t } = useI18n();
</script>
