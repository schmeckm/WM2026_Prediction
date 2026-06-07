<template>
  <ToastContainer />
  <router-view />
</template>

<script setup>
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ToastContainer from './components/ToastContainer.vue';

const { locale } = useI18n();

watch(locale, (value) => {
  document.documentElement.lang = value || 'de';
}, { immediate: true });
</script>
