<template>
  <div>
    <div class="page-header">
      <h1>{{ t('adminPages.scoringRules.title') }}</h1>
    </div>

    <AlertMessage v-if="message" :message="message" type="success" />
    <ErrorState v-if="loadError" :message="loadError" @retry="loadRules" />
    <AlertMessage v-else-if="error" :message="error" type="error" />

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <div class="card mb-2" style="max-width: 640px;">
        <div class="card-header"><h3>{{ t('adminPages.scoringRules.matchPointsTitle') }}</h3></div>
        <div class="card-body">
          <form @submit.prevent="handleSave">
            <div class="form-group">
              <label>{{ t('adminPages.scoringRules.exactResult') }}</label>
              <input v-model.number="form.exactResultPoints" type="number" min="0" class="form-control" required />
            </div>
            <div class="form-group">
              <label>{{ t('adminPages.scoringRules.goalDifference') }}</label>
              <input v-model.number="form.goalDifferencePoints" type="number" min="0" class="form-control" required />
            </div>
            <div class="form-group">
              <label>{{ t('adminPages.scoringRules.tendency') }}</label>
              <input v-model.number="form.tendencyPoints" type="number" min="0" class="form-control" required />
            </div>
            <div class="form-group">
              <label>{{ t('adminPages.scoringRules.wrongPrediction') }}</label>
              <input v-model.number="form.wrongPredictionPoints" type="number" min="0" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? t('common.saving') : t('adminPages.scoringRules.saveRules') }}
            </button>
          </form>

          <div class="example-box">
            <h4>{{ t('adminPages.scoringRules.exampleTitle') }}</h4>
            <p class="text-muted example-text">
              {{ t('adminPages.scoringRules.exampleLine1') }}<br />
              {{ t('adminPages.scoringRules.exampleExact', { points: form.exactResultPoints }) }}<br />
              {{ t('adminPages.scoringRules.exampleDiff', { points: form.goalDifferencePoints }) }}<br />
              {{ t('adminPages.scoringRules.exampleTendency', { points: form.tendencyPoints }) }}<br />
              {{ t('adminPages.scoringRules.exampleWrong', { points: form.wrongPredictionPoints }) }}
            </p>
          </div>
        </div>
      </div>

      <div class="card mb-2" style="max-width: 640px;">
        <div class="card-header"><h3>{{ t('adminPages.scoringRules.teamRankingTitle') }}</h3></div>
        <div class="card-body">
          <p class="text-muted">{{ t('adminPages.scoringRules.teamRankingDesc') }}</p>
          <form @submit.prevent="handleSaveTeamSettings">
            <div class="form-group">
              <label>{{ t('adminPages.scoringRules.teamRankingMode') }}</label>
              <select v-model="teamSettings.teamRankingMode" class="form-control">
                <option value="active_predictors_only">{{ t('adminPages.scoringRules.teamModeActiveOnly') }}</option>
                <option value="all_members">{{ t('adminPages.scoringRules.teamModeAllMembers') }}</option>
              </select>
            </div>
            <div v-if="teamSettings.teamRankingMode === 'active_predictors_only'" class="form-group">
              <label>{{ t('adminPages.scoringRules.teamActiveMinPredictions') }}</label>
              <input
                v-model.number="teamSettings.teamActiveMinPredictions"
                type="number"
                min="1"
                class="form-control"
                required
              />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="savingTeam">
              {{ savingTeam ? t('common.saving') : t('adminPages.scoringRules.saveTeamRules') }}
            </button>
          </form>
        </div>
      </div>

      <div class="card" style="max-width: 640px;">
        <div class="card-header"><h3>{{ t('adminPages.scoringRules.recalculateTitle') }}</h3></div>
        <div class="card-body">
          <p class="text-muted">{{ t('adminPages.scoringRules.recalculateDesc') }}</p>
          <ol class="recalculate-steps text-muted">
            <li>{{ t('adminPages.scoringRules.recalculateStepBackup') }}</li>
            <li>{{ t('adminPages.scoringRules.recalculateStepSave') }}</li>
            <li>{{ t('adminPages.scoringRules.recalculateStepRun') }}</li>
            <li>{{ t('adminPages.scoringRules.recalculateStepNotify') }}</li>
          </ol>
          <button type="button" class="btn btn-accent" :disabled="recalculating" @click="handleRecalculate">
            {{ recalculating ? t('adminPages.dashboard.recalculating') : t('adminPages.scoringRules.recalculateNow') }}
          </button>
          <p v-if="recalculateResult" class="recalculate-result text-muted">
            {{ t('adminPages.scoringRules.recalculateDone', recalculateResult) }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import AlertMessage from '../../components/AlertMessage.vue';
import ErrorState from '../../components/ErrorState.vue';

const { t } = useI18n();

const loading = ref(true);
const saving = ref(false);
const savingTeam = ref(false);
const recalculating = ref(false);
const message = ref('');
const loadError = ref('');
const error = ref('');
const recalculateResult = ref(null);

const form = ref({
  exactResultPoints: 4,
  goalDifferencePoints: 3,
  tendencyPoints: 2,
  wrongPredictionPoints: 0,
});

const teamSettings = ref({
  teamRankingMode: 'active_predictors_only',
  teamActiveMinPredictions: 1,
});

async function loadRules() {
  loading.value = true;
  loadError.value = '';
  try {
    const [rulesRes, settingsRes] = await Promise.all([
      api.get('/scoring-rules'),
      api.get('/settings'),
    ]);
    form.value = { ...rulesRes.data };
    teamSettings.value = {
      teamRankingMode: settingsRes.data.teamRankingMode || 'active_predictors_only',
      teamActiveMinPredictions: settingsRes.data.teamActiveMinPredictions ?? 1,
    };
  } catch (err) {
    loadError.value = err.response?.data?.error || t('adminPages.scoringRules.loadFailed');
  } finally {
    loading.value = false;
  }
}

onMounted(loadRules);

async function handleSave() {
  saving.value = true;
  error.value = '';
  message.value = '';
  try {
    await api.put('/scoring-rules', form.value);
    message.value = t('adminPages.scoringRules.saved');
  } catch (err) {
    error.value = err.response?.data?.error || t('adminPages.scoringRules.saveFailed');
  } finally {
    saving.value = false;
  }
}

async function handleSaveTeamSettings() {
  savingTeam.value = true;
  error.value = '';
  message.value = '';
  try {
    await api.put('/admin/settings', teamSettings.value);
    message.value = t('adminPages.scoringRules.teamRulesSaved');
  } catch (err) {
    error.value = err.response?.data?.error || t('adminPages.scoringRules.saveFailed');
  } finally {
    savingTeam.value = false;
  }
}

async function handleRecalculate() {
  if (!window.confirm(t('adminPages.scoringRules.recalculateConfirm'))) return;
  recalculating.value = true;
  error.value = '';
  message.value = '';
  recalculateResult.value = null;
  try {
    const { data } = await api.post('/admin/recalculate-points');
    recalculateResult.value = data;
    message.value = t('adminPages.scoringRules.recalculateSuccess');
  } catch (err) {
    error.value = err.response?.data?.error || t('adminPages.scoringRules.recalculateFailed');
  } finally {
    recalculating.value = false;
  }
}
</script>

<style scoped>
.mb-2 { margin-bottom: 1.5rem; }

.example-box {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
}
.example-box h4 {
  margin-bottom: 0.5rem;
}
.example-text {
  font-size: 0.875rem;
  margin: 0;
}

.recalculate-steps {
  font-size: 0.875rem;
  margin: 0 0 1rem;
  padding-left: 1.25rem;
}

.recalculate-result {
  margin: 1rem 0 0;
  font-size: 0.875rem;
}
</style>
