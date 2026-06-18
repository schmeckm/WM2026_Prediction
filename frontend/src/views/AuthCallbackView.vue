<template>
  <AuthImmersiveLayout :title="t('auth.signIn')">
    <p class="auth-immersive-muted">{{ t('auth.ssoSigningIn') }}</p>
    <AlertMessage v-if="error" :message="error" type="error" class="auth-immersive-alert" />
    <router-link v-if="error" to="/login" class="auth-immersive-link">{{ t('auth.toLogin') }}</router-link>
  </AuthImmersiveLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/authStore';
import AlertMessage from '../components/AlertMessage.vue';
import AuthImmersiveLayout from '../components/AuthImmersiveLayout.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const error = ref('');

/** Dedupe concurrent exchange attempts (e.g. Vue dev double-mount). */
const ssoExchangeInflight = new Map();

function normalizeCode(raw) {
  if (Array.isArray(raw)) return raw[0] || '';
  return typeof raw === 'string' ? raw : '';
}

function exchangeOnce(code) {
  if (ssoExchangeInflight.has(code)) {
    return ssoExchangeInflight.get(code);
  }
  const promise = authStore.exchangeSsoCode(code).finally(() => {
    ssoExchangeInflight.delete(code);
  });
  ssoExchangeInflight.set(code, promise);
  return promise;
}

onMounted(async () => {
  const code = normalizeCode(route.query.code);
  if (!code) {
    error.value = t('auth.loginFailed');
    return;
  }

  const exchangeKey = `sso-exchange:${code}`;
  if (sessionStorage.getItem(exchangeKey) === 'done') {
    router.replace(authStore.isAdmin ? '/admin' : '/dashboard');
    return;
  }

  try {
    // A fresh SSO code must replace any stale token still in localStorage.
    if (authStore.isAuthenticated) {
      authStore.logout();
    }
    await exchangeOnce(code);
    sessionStorage.setItem(exchangeKey, 'done');
    router.replace(authStore.isAdmin ? '/admin' : '/dashboard');
  } catch (err) {
    sessionStorage.removeItem(exchangeKey);
    if (err.response?.data?.code === 'errors.ssoTeamRequired') {
      router.replace({ path: '/auth/complete-registration', query: { code } });
      return;
    }
    error.value = err.response?.data?.error || t('auth.loginFailed');
  }
});
</script>
