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
        <div class="card-header"><h3>{{ t('adminPages.scoringRules.knockoutPointsTitle') }}</h3></div>
        <div class="card-body">
          <p class="text-muted">{{ t('adminPages.scoringRules.knockoutPointsDesc') }}</p>
          <form @submit.prevent="handleSave">
            <label class="checkbox-label">
              <input v-model="form.knockoutStagePointsEnabled" type="checkbox" />
              {{ t('adminPages.scoringRules.knockoutPointsEnabled') }}
            </label>

            <div v-if="form.knockoutStagePointsEnabled" class="knockout-points-table-wrap">
              <table class="knockout-points-table">
                <thead>
                  <tr>
                    <th>{{ t('adminPages.scoringRules.knockoutStageColumn') }}</th>
                    <th>{{ t('adminPages.scoringRules.exactResult') }}</th>
                    <th>{{ t('adminPages.scoringRules.goalDifference') }}</th>
                    <th>{{ t('adminPages.scoringRules.tendency') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stageKey in knockoutStageKeys" :key="stageKey">
                    <td>{{ t(`adminPages.scoringRules.knockoutStages.${stageKey}`) }}</td>
                    <td>
                      <input
                        v-model.number="form.knockoutStagePoints[stageKey].exactResultPoints"
                        type="number"
                        min="0"
                        class="form-control form-control-sm"
                        required
                      />
                    </td>
                    <td>
                      <input
                        v-model.number="form.knockoutStagePoints[stageKey].goalDifferencePoints"
                        type="number"
                        min="0"
                        class="form-control form-control-sm"
                        required
                      />
                    </td>
                    <td>
                      <input
                        v-model.number="form.knockoutStagePoints[stageKey].tendencyPoints"
                        type="number"
                        min="0"
                        class="form-control form-control-sm"
                        required
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              <button type="button" class="btn btn-secondary btn-sm" @click="resetKnockoutDefaults">
                {{ t('adminPages.scoringRules.knockoutResetDefaults') }}
              </button>
            </div>

            <button type="submit" class="btn btn-primary" :disabled="saving" style="margin-top: 1rem;">
              {{ saving ? t('common.saving') : t('adminPages.scoringRules.saveRules') }}
            </button>
          </form>
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
import { ref, watch, onMounted } from 'vue';
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
  knockoutStagePointsEnabled: false,
  knockoutStagePoints: {},
});

const knockoutStageKeys = [
  'LAST_32',
  'LAST_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
];

function buildDefaultKnockoutStagePoints(base = form.value) {
  const bonuses = {
    LAST_32: [0, 0, 0],
    LAST_16: [1, 1, 1],
    QUARTER_FINALS: [2, 2, 2],
    SEMI_FINALS: [4, 3, 2],
    THIRD_PLACE: [2, 2, 2],
    FINAL: [6, 5, 4],
  };

  return Object.fromEntries(
    knockoutStageKeys.map((key) => {
      const [exactBonus, diffBonus, tendencyBonus] = bonuses[key];
      return [key, {
        exactResultPoints: (base.exactResultPoints ?? 4) + exactBonus,
        goalDifferencePoints: (base.goalDifferencePoints ?? 3) + diffBonus,
        tendencyPoints: (base.tendencyPoints ?? 2) + tendencyBonus,
      }];
    }),
  );
}

function normalizeKnockoutStagePoints(rawPoints = {}) {
  const defaults = buildDefaultKnockoutStagePoints();
  return Object.fromEntries(
    knockoutStageKeys.map((key) => {
      const fallback = defaults[key];
      const entry = rawPoints[key] || {};
      return [key, {
        exactResultPoints: Number.isFinite(Number(entry.exactResultPoints))
          ? Number(entry.exactResultPoints)
          : fallback.exactResultPoints,
        goalDifferencePoints: Number.isFinite(Number(entry.goalDifferencePoints))
          ? Number(entry.goalDifferencePoints)
          : fallback.goalDifferencePoints,
        tendencyPoints: Number.isFinite(Number(entry.tendencyPoints))
          ? Number(entry.tendencyPoints)
          : fallback.tendencyPoints,
      }];
    }),
  );
}

function resetKnockoutDefaults() {
  form.value.knockoutStagePoints = buildDefaultKnockoutStagePoints();
}

watch(
  () => form.value.knockoutStagePointsEnabled,
  (enabled) => {
    if (!enabled) return;
    const hasAllStages = knockoutStageKeys.every(
      (key) => form.value.knockoutStagePoints?.[key]?.exactResultPoints != null,
    );
    if (!hasAllStages) {
      form.value.knockoutStagePoints = buildDefaultKnockoutStagePoints();
    }
  },
);

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
    form.value = {
      ...rulesRes.data,
      knockoutStagePointsEnabled: !!rulesRes.data.knockoutStagePointsEnabled,
      knockoutStagePoints: normalizeKnockoutStagePoints(rulesRes.data.knockoutStagePoints),
    };
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
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.knockout-points-table-wrap {
  margin-top: 0.5rem;
}

.knockout-points-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.75rem;
}

.knockout-points-table th,
.knockout-points-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.knockout-points-table th {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.knockout-points-table .form-control-sm {
  min-width: 4.5rem;
}

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
