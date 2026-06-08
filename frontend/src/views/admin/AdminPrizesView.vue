<template>
  <div>
    <div class="page-header">
      <h1>{{ t('adminPages.prizes.title') }}</h1>
      <p class="text-muted">{{ t('adminPages.prizes.subtitle') }}</p>
    </div>

    <AlertMessage v-if="message" :message="message" type="success" />
    <AlertMessage v-if="error" :message="error" type="error" />

    <LoadingSpinner v-if="loading" />

    <div v-else class="card" style="max-width: 720px;">
      <div class="card-body">
        <form @submit.prevent="handleSave">
          <label class="checkbox-label mb-2">
            <input v-model="form.prizesEnabled" type="checkbox" />
            {{ t('adminPages.prizes.enabled') }}
          </label>
          <p class="text-muted hint">{{ t('adminPages.prizes.enabledHint') }}</p>

          <div v-for="prize in form.prizes" :key="prize.rank" class="prize-form-block">
            <h3>{{ t('adminPages.prizes.place', { rank: prize.rank }) }}</h3>
            <div class="form-group">
              <label>{{ t('adminPages.prizes.fields.title') }}</label>
              <input v-model="prize.title" type="text" class="form-control" maxlength="100" />
            </div>
            <div class="form-group">
              <label>{{ t('adminPages.prizes.fields.value') }}</label>
              <input v-model="prize.value" type="text" class="form-control" maxlength="100" :placeholder="t('adminPages.prizes.valuePlaceholder')" />
            </div>
            <div class="form-group">
              <label>{{ t('adminPages.prizes.fields.description') }}</label>
              <textarea v-model="prize.description" class="form-control" rows="3" maxlength="500" />
            </div>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? t('common.saving') : t('adminPages.prizes.save') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import AlertMessage from '../../components/AlertMessage.vue';
import { useAppSettingsStore } from '../../stores/appSettingsStore';

const { t } = useI18n();
const appSettings = useAppSettingsStore();

const loading = ref(true);
const saving = ref(false);
const message = ref('');
const error = ref('');

const form = ref({
  prizesEnabled: false,
  prizes: [
    { rank: 1, title: '', description: '', value: '' },
    { rank: 2, title: '', description: '', value: '' },
    { rank: 3, title: '', description: '', value: '' },
  ],
});

function applyFormFromSettings(data) {
  form.value.prizesEnabled = !!data.prizesEnabled;
  const prizes = Array.isArray(data.prizes) ? data.prizes : [];
  form.value.prizes = [1, 2, 3].map((rank) => {
    const entry = prizes.find((p) => Number(p.rank) === rank) || {};
    return {
      rank,
      title: entry.title || '',
      description: entry.description || '',
      value: entry.value || '',
    };
  });
}

onMounted(async () => {
  try {
    const { data } = await api.get('/settings');
    applyFormFromSettings(data);
  } finally {
    loading.value = false;
  }
});

async function handleSave() {
  saving.value = true;
  error.value = '';
  message.value = '';
  try {
    const { data } = await api.put('/admin/settings', {
      prizesEnabled: form.value.prizesEnabled,
      prizes: form.value.prizes,
    });
    applyFormFromSettings(data);
    appSettings.applySettings(data);
    message.value = t('adminPages.prizes.saved');
  } catch (err) {
    error.value = err.response?.data?.error || t('adminPages.prizes.saveFailed');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.mb-2 {
  margin-bottom: 0.75rem;
}

.hint {
  margin: 0 0 1.5rem;
  font-size: 0.875rem;
}

.prize-form-block {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.prize-form-block:last-of-type {
  border-bottom: none;
  margin-bottom: 1rem;
}

.prize-form-block h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
}
</style>
