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

onMounted(async () => {
  const code = route.query.code;
  if (!code) {
    error.value = t('auth.loginFailed');
    return;
  }

  try {
    await authStore.exchangeSsoCode(code);
    router.replace(authStore.isAdmin ? '/admin' : '/dashboard');
  } catch (err) {
    error.value = err.response?.data?.error || t('auth.loginFailed');
  }
});
</script>
