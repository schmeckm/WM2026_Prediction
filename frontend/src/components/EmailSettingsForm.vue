<template>
  <form @submit.prevent="$emit('save', form)">
    <div class="form-group">
      <label class="checkbox-label">
        <input v-model="form.emailRemindersEnabled" type="checkbox" />
        {{ t('adminPages.email.form.enableReminders') }}
      </label>
    </div>
    <div class="form-group">
      <label class="checkbox-label">
        <input v-model="form.adminSyncErrorEmails" type="checkbox" />
        {{ t('adminPages.email.form.adminSyncErrors') }}
      </label>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>{{ t('adminPages.email.form.reminderTime') }}</label>
        <input v-model="form.reminderTime" type="time" class="form-control" />
      </div>
      <div class="form-group">
        <label>{{ t('adminPages.email.form.frequency') }}</label>
        <select v-model="form.reminderFrequency" class="form-control">
          <option value="daily">{{ t('adminPages.email.form.daily') }}</option>
          <option value="weekly">{{ t('adminPages.email.form.weekly') }}</option>
        </select>
      </div>
    </div>
    <div class="btn-group">
      <button type="submit" class="btn btn-primary" :disabled="loading">{{ t('common.save') }}</button>
      <button type="button" class="btn btn-secondary" @click="$emit('test-email')">
        {{ t('adminPages.email.form.sendTestEmail') }}
      </button>
      <button type="button" class="btn btn-accent" @click="$emit('send-reminders')">
        {{ t('adminPages.email.form.sendRemindersNow') }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  settings: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
});

defineEmits(['save', 'test-email', 'send-reminders']);

const form = reactive({
  emailRemindersEnabled: false,
  adminSyncErrorEmails: true,
  reminderTime: '09:00',
  reminderFrequency: 'daily',
});

watch(() => props.settings, (s) => {
  if (s) Object.assign(form, {
    emailRemindersEnabled: s.emailRemindersEnabled ?? false,
    adminSyncErrorEmails: s.adminSyncErrorEmails ?? true,
    reminderTime: s.reminderTime ?? '09:00',
    reminderFrequency: s.reminderFrequency ?? 'daily',
  });
}, { immediate: true });
</script>

<style scoped>
.checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
</style>
