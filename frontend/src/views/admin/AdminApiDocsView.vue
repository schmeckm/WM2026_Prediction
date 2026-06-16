<template>
  <div class="admin-api-docs">
    <div class="page-header">
      <h1>{{ t('adminPages.apiDocs.title') }}</h1>
      <p class="page-subtitle">{{ t('adminPages.apiDocs.subtitle') }}</p>
    </div>

    <LoadingSpinner v-if="loading" />
    <p v-else-if="error" class="error-text">{{ error }}</p>
    <div v-show="!loading && !error" id="swagger-ui" class="swagger-wrap" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SwaggerUI from 'swagger-ui-dist/swagger-ui-es-bundle.js';
import 'swagger-ui-dist/swagger-ui.css';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import i18n from '../../i18n';
import LoadingSpinner from '../../components/LoadingSpinner.vue';

const { t } = useI18n();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref('');
let swaggerInstance = null;

onMounted(async () => {
  try {
    const { data: spec } = await api.get('/docs/openapi.json');
    const locale = i18n.global.locale.value || authStore.user?.language || 'de';

    swaggerInstance = SwaggerUI({
      spec,
      dom_id: '#swagger-ui',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      persistAuthorization: true,
      requestInterceptor: (req) => {
        if (authStore.token) {
          req.headers.Authorization = `Bearer ${authStore.token}`;
        }
        req.headers['X-Language'] = locale;
        return req;
      },
    });
  } catch (err) {
    error.value = t('adminPages.apiDocs.loadFailed');
    console.error('Swagger load failed:', err);
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  swaggerInstance = null;
});
</script>

<style scoped>
.admin-api-docs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.page-subtitle {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.swagger-wrap {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #fff;
}

.error-text {
  color: var(--danger);
}

.admin-api-docs :deep(.swagger-ui) {
  font-family: inherit;
}

.admin-api-docs :deep(.swagger-ui .topbar) {
  display: none;
}
</style>
