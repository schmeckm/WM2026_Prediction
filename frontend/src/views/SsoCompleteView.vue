<template>
  <AuthImmersiveLayout
    :title="t('auth.ssoCompleteTitle')"
    :hint="t('auth.ssoCompleteHint')"
    :welcome-text="t('auth.ssoCompleteWelcomeText')"
  >
    <AlertMessage v-if="error" :message="error" type="error" class="auth-immersive-alert" />

    <form v-if="profile" class="auth-immersive-form" @submit.prevent="handleComplete">
      <div class="auth-immersive-form-row">
        <div class="auth-immersive-field">
          <label>{{ t('auth.firstName') }}</label>
          <input :value="profile.firstName" type="text" class="auth-immersive-input" readonly />
        </div>
        <div class="auth-immersive-field">
          <label>{{ t('auth.lastName') }}</label>
          <input :value="profile.lastName" type="text" class="auth-immersive-input" readonly />
        </div>
      </div>

      <div class="auth-immersive-field">
        <label>{{ t('auth.emailAddress') }}</label>
        <input :value="profile.email" type="email" class="auth-immersive-input" readonly />
      </div>

      <div class="auth-immersive-field">
        <label for="team">{{ t('auth.teamDepartment') }}</label>
        <select id="team" v-model="teamId" class="auth-immersive-input" required>
          <option :value="null" disabled>{{ t('auth.selectTeam') }}</option>
          <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
        </select>
      </div>

      <button type="submit" class="auth-immersive-submit" :disabled="loading">
        {{ loading ? t('auth.registering') : t('auth.ssoCompleteSubmit') }}
      </button>
    </form>

    <p v-else-if="!error" class="auth-immersive-muted">{{ t('common.loading') }}</p>
    <router-link v-if="error" to="/login" class="auth-immersive-link">{{ t('auth.toLogin') }}</router-link>
  </AuthImmersiveLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import AlertMessage from '../components/AlertMessage.vue';
import AuthImmersiveLayout from '../components/AuthImmersiveLayout.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const profile = ref(null);
const teams = ref([]);
const teamId = ref(null);
const loading = ref(false);
const error = ref('');
const ssoCode = ref('');

onMounted(async () => {
  ssoCode.value = route.query.code || '';
  if (!ssoCode.value) {
    error.value = t('auth.ssoCompleteFailed');
    return;
  }

  try {
    const [pendingRes, teamsRes] = await Promise.all([
      api.get('/auth/sso-pending', { params: { code: ssoCode.value } }),
      api.get('/teams'),
    ]);
    profile.value = pendingRes.data;
    teams.value = teamsRes.data;
  } catch (err) {
    error.value = err.response?.data?.error || t('auth.ssoCompleteFailed');
  }
});

async function handleComplete() {
  if (!teamId.value) {
    error.value = t('auth.teamRequired');
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await authStore.completeSsoRegistration(ssoCode.value, teamId.value);
    router.replace('/dashboard');
  } catch (err) {
    error.value = err.response?.data?.error || t('auth.ssoCompleteFailed');
  } finally {
    loading.value = false;
  }
}
</script>
