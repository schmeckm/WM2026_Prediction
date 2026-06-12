<template>
  <div class="feedback-page">
    <div class="page-header">
      <h1>{{ t('feedback.title') }}</h1>
      <span class="text-muted">{{ t('feedback.subtitle') }}</span>
    </div>

    <AlertMessage v-if="success" :message="success" type="success" />
    <AlertMessage v-if="error" :message="error" type="error" />

    <div class="card">
      <div class="card-body">
        <form @submit.prevent="submit">
          <div class="form-group">
            <label for="feedbackType">{{ t('feedback.type') }}</label>
            <select id="feedbackType" v-model="form.type" class="form-control" required>
              <option value="bug">{{ t('feedback.typeBug') }}</option>
              <option value="change">{{ t('feedback.typeChange') }}</option>
              <option value="feature">{{ t('feedback.typeFeature') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="feedbackTitle">{{ t('feedback.titleLabel') }}</label>
            <input
              id="feedbackTitle"
              v-model="form.title"
              type="text"
              class="form-control"
              maxlength="140"
              required
            />
          </div>

          <div class="form-group">
            <label for="feedbackDescription">{{ t('feedback.description') }}</label>
            <textarea
              id="feedbackDescription"
              v-model="form.description"
              class="form-control"
              rows="6"
              maxlength="5000"
              required
            />
            <p class="text-muted feedback-hint">{{ t('feedback.descriptionHint') }}</p>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="busy">
            {{ busy ? t('feedback.sending') : t('feedback.send') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import AlertMessage from '../components/AlertMessage.vue';

const { t } = useI18n();

const form = ref({
  type: 'bug',
  title: '',
  description: '',
});

const busy = ref(false);
const success = ref('');
const error = ref('');

async function submit() {
  busy.value = true;
  success.value = '';
  error.value = '';
  try {
    const { data } = await api.post('/feedback', {
      type: form.value.type,
      title: form.value.title,
      description: form.value.description,
      pageUrl: globalThis.location?.href,
      appVersion: import.meta.env.VITE_APP_VERSION || null,
    });
    success.value = data?.message || t('feedback.sent');
    form.value.title = '';
    form.value.description = '';
  } catch (err) {
    error.value = err.response?.data?.error || t('feedback.failed');
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.feedback-page {
  max-width: 40rem;
}

.feedback-hint {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  line-height: 1.5;
}
</style>
