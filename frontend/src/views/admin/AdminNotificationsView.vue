<template>
  <div>
    <div class="page-header"><h1>{{ t('adminPages.notifications.title') }}</h1></div>
    <AlertMessage v-if="message" :message="message" type="success" />
    <AlertMessage v-if="error" :message="error" type="error" />

    <div class="card" style="max-width: 720px;">
      <div class="card-body">
        <form @submit.prevent="send">
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('adminPages.notifications.recipientMode') }}</label>
              <select v-model="recipientMode" class="form-control">
                <option value="all">{{ t('adminPages.notifications.recipientAll') }}</option>
                <option value="single">{{ t('adminPages.notifications.recipientSingle') }}</option>
              </select>
            </div>
            <div v-if="recipientMode === 'single'" class="form-group">
              <label>{{ t('adminPages.notifications.recipientUser') }}</label>
              <select v-model.number="form.userId" class="form-control" required>
                <option :value="null" disabled>{{ t('adminPages.notifications.recipientUserPlaceholder') }}</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.lastName }}, {{ user.firstName }} ({{ user.email }})
                </option>
              </select>
            </div>
          </div>

          <label v-if="recipientMode === 'all'" class="checkbox-label">
            <input v-model="form.includeAdmins" type="checkbox" />
            {{ t('adminPages.notifications.includeAdmins') }}
          </label>

          <div class="form-group">
            <label>{{ t('adminPages.notifications.formTitle') }}</label>
            <input v-model="form.title" class="form-control" required />
          </div>
          <div class="form-group">
            <label>{{ t('adminPages.notifications.formMessage') }}</label>
            <textarea v-model="form.message" class="form-control" rows="4" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('adminPages.notifications.formType') }}</label>
              <select v-model="form.type" class="form-control">
                <option value="info">{{ t('adminPages.notifications.typeInfo') }}</option>
                <option value="success">{{ t('adminPages.notifications.typeSuccess') }}</option>
                <option value="warning">{{ t('adminPages.notifications.typeWarning') }}</option>
                <option value="error">{{ t('adminPages.notifications.typeError') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ t('adminPages.notifications.formLink') }}</label>
              <input v-model="form.link" class="form-control" placeholder="/matches" />
            </div>
          </div>

          <div class="delivery-options">
            <label class="checkbox-label">
              <input v-model="form.sendInApp" type="checkbox" />
              {{ t('adminPages.notifications.sendInApp') }}
            </label>
            <label class="checkbox-label">
              <input v-model="form.sendEmail" type="checkbox" />
              {{ t('adminPages.notifications.sendEmail') }}
            </label>
            <label v-if="form.sendInApp" class="checkbox-label">
              <input v-model="form.showOnLogin" type="checkbox" />
              {{ t('adminPages.notifications.showOnLogin') }}
            </label>
          </div>
          <p class="text-muted delivery-hint">{{ t('adminPages.notifications.deliveryHint') }}</p>

          <button type="submit" class="btn btn-primary" :disabled="loading || !canSend">
            {{ loading ? t('adminPages.notifications.sending') : t('adminPages.notifications.send') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../services/api';
import AlertMessage from '../../components/AlertMessage.vue';

const { t } = useI18n();

const users = ref([]);
const recipientMode = ref('all');
const loading = ref(false);
const message = ref('');
const error = ref('');

const form = ref({
  title: '',
  message: '',
  link: '',
  type: 'info',
  userId: null,
  sendInApp: true,
  sendEmail: false,
  showOnLogin: false,
  includeAdmins: false,
});

const canSend = computed(() => (
  (form.value.sendInApp || form.value.sendEmail)
  && (recipientMode.value === 'all' || form.value.userId)
));

async function loadUsers() {
  const { data } = await api.get('/users');
  users.value = data;
}

onMounted(loadUsers);

async function send() {
  loading.value = true;
  message.value = '';
  error.value = '';
  try {
    const payload = {
      title: form.value.title,
      message: form.value.message,
      link: form.value.link || null,
      type: form.value.type,
      sendInApp: form.value.sendInApp,
      sendEmail: form.value.sendEmail,
      showOnLogin: form.value.showOnLogin,
      includeAdmins: recipientMode.value === 'all' ? form.value.includeAdmins : false,
      userId: recipientMode.value === 'single' ? form.value.userId : null,
    };
    const { data } = await api.post('/admin/notifications/send', payload);
    message.value = t('adminPages.notifications.sentSummary', {
      inAppSent: data.inAppSent || 0,
      emailsSent: data.emailsSent || 0,
      emailsSkipped: data.emailsSkipped || 0,
    });
    form.value = {
      title: '',
      message: '',
      link: '',
      type: 'info',
      userId: null,
      sendInApp: true,
      sendEmail: false,
      showOnLogin: false,
      includeAdmins: false,
    };
    recipientMode.value = 'all';
  } catch (err) {
    error.value = err.response?.data?.error || t('adminPages.notifications.sendFailed');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.delivery-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.delivery-hint {
  font-size: 0.875rem;
  margin: 0 0 1rem;
}
</style>
