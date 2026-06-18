<template>
  <div class="rules-help-page">
    <div class="page-header rte-rules-header">
      <div class="rte-rules-header__content">
        <p class="rte-eyebrow">{{ t('help.eyebrow') }}</p>
        <h1>
          {{ t('help.title') }}
          <span class="rte-accent">{{ t('help.titleAccent') }}</span>
        </h1>
        <p class="text-muted rte-subtitle">{{ t('help.subtitle') }}</p>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else class="card help-document">
      <div class="card-body">
        <section class="help-section">
          <h2>{{ t('help.sections.winner.title') }}</h2>
          <p>{{ t('help.sections.winner.text') }}</p>
        </section>

        <section class="help-section">
          <h2>{{ t('help.sections.scoring.title') }}</h2>
          <p>{{ t('help.sections.scoring.intro') }}</p>

          <h3>{{ t('help.scoring.groupTitle') }}</h3>
          <ul class="help-list">
            <li>{{ t('help.scoring.exact', points) }}</li>
            <li>{{ t('help.scoring.goalDiff', points) }}</li>
            <li>{{ t('help.scoring.tendency', points) }}</li>
            <li>{{ t('help.scoring.wrong', points) }}</li>
          </ul>
          <div class="help-callout">
            <h4>{{ t('help.example.title') }}</h4>
            <p class="text-muted">{{ t('help.example.result') }}</p>
            <p>{{ t('help.example.exact', points) }}</p>
            <p>{{ t('help.example.goalDiff', points) }}</p>
            <p>{{ t('help.example.tendency', points) }}</p>
            <p>{{ t('help.example.wrong', points) }}</p>
          </div>

          <h3>{{ t('help.sections.knockoutScoring.title') }}</h3>
          <p v-if="rules.knockoutStagePointsEnabled">
            {{ t('help.sections.knockoutScoring.intro') }}
          </p>
          <p v-else class="help-callout help-callout--accent">
            {{ t('help.sections.knockoutScoring.disabled') }}
          </p>

          <div v-if="knockoutRows.length" class="help-scoring-table-wrap">
            <table class="help-scoring-table">
              <thead>
                <tr>
                  <th>{{ t('help.knockoutScoring.columnStage') }}</th>
                  <th>{{ t('help.knockoutScoring.columnExact') }}</th>
                  <th>{{ t('help.knockoutScoring.columnGoalDiff') }}</th>
                  <th>{{ t('help.knockoutScoring.columnTendency') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in knockoutRows" :key="row.key">
                  <td>{{ row.stage }}</td>
                  <td>{{ row.exact }}</td>
                  <td>{{ row.goalDiff }}</td>
                  <td>{{ row.tendency }}</td>
                </tr>
              </tbody>
            </table>
            <p class="text-muted help-knockout-note">{{ t('help.sections.knockoutScoring.note') }}</p>
          </div>
        </section>

        <section class="help-section">
          <h2>{{ t('help.sections.deadline.title') }}</h2>
          <p>{{ t('help.sections.deadline.text') }}</p>
        </section>

        <section class="help-section">
          <h2>{{ t('help.sections.participation.title') }}</h2>
          <p>{{ t('help.sections.participation.intro') }}</p>
          <p class="help-callout help-callout--accent">{{ t('help.sections.participation.rteRule') }}</p>
          <h3>{{ t('help.sections.participation.tableTitle') }}</h3>
          <div class="help-variant-grid">
            <div class="help-variant-row help-variant-row--head">
              <span>{{ t('help.sections.participation.tableModel') }}</span>
              <span>{{ t('help.sections.participation.tableEffort') }}</span>
            </div>
            <div class="help-variant-row help-variant-row--active">
              <span>{{ t('help.sections.participation.variants.all') }}</span>
              <span>{{ t('help.sections.participation.variants.allEffort') }}</span>
            </div>
            <div class="help-variant-row">
              <span>{{ t('help.sections.participation.variants.split') }}</span>
              <span>{{ t('help.sections.participation.variants.splitEffort') }}</span>
            </div>
            <div class="help-variant-row">
              <span>{{ t('help.sections.participation.variants.mandatory') }}</span>
              <span>{{ t('help.sections.participation.variants.mandatoryEffort') }}</span>
            </div>
            <div class="help-variant-row">
              <span>{{ t('help.sections.participation.variants.optional') }}</span>
              <span>{{ t('help.sections.participation.variants.optionalEffort') }}</span>
            </div>
          </div>
          <p class="text-muted help-variant-note">{{ t('help.sections.participation.tableNote') }}</p>
        </section>

        <section class="help-section">
          <h2>{{ t('help.sections.profile.title') }}</h2>
          <p>{{ t('help.sections.profile.text') }}</p>
        </section>

        <section class="help-section">
          <h2>{{ t('help.sections.bonus.title') }}</h2>
          <p>{{ t('help.sections.bonus.text') }}</p>
        </section>

        <section class="help-section">
          <h2>{{ t('help.sections.leaderboard.title') }}</h2>
          <p>{{ t('help.sections.leaderboard.text') }}</p>
          <p class="text-muted">{{ t('help.sections.leaderboard.correctHint') }}</p>
          <h3>{{ t('help.tiebreaker.title') }}</h3>
          <ol class="help-list">
            <li>{{ t('help.tiebreaker.item1') }}</li>
            <li>{{ t('help.tiebreaker.item2') }}</li>
            <li>{{ t('help.tiebreaker.item3') }}</li>
            <li>{{ t('help.tiebreaker.item4') }}</li>
          </ol>
        </section>

        <section class="help-section">
          <h2>{{ t('help.sections.teams.title') }}</h2>
          <p>{{ t('help.sections.teams.text') }}</p>
        </section>

        <section class="help-section">
          <h2>{{ t('help.sections.teamPerformance.title') }}</h2>
          <p>{{ t('help.sections.teamPerformance.intro') }}</p>
          <ul class="help-list">
            <li>{{ t('help.sections.teamPerformance.pitch', pitchThresholds) }}</li>
            <li>{{ t('help.sections.teamPerformance.yellow', pitchThresholds) }}</li>
            <li>{{ t('help.sections.teamPerformance.red', pitchThresholds) }}</li>
          </ul>
          <p class="text-muted">{{ t('help.sections.teamPerformance.note') }}</p>
          <router-link to="/team-performance" class="btn btn-secondary btn-sm">{{ t('help.sections.teamPerformance.link') }}</router-link>
        </section>

        <section class="help-section help-section--last">
          <h2>{{ t('help.sections.ai.title') }}</h2>
          <p>{{ t('help.sections.ai.text') }}</p>
          <router-link to="/ai-coach" class="btn btn-primary btn-sm">{{ t('help.sections.ai.link') }}</router-link>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner.vue';

import { RED_CARD_THRESHOLD, YELLOW_CARD_THRESHOLD } from '../composables/useTeamPitchZones';

const { t } = useI18n();
const loading = ref(true);
const pitchThresholds = computed(() => ({
  red: RED_CARD_THRESHOLD,
  yellow: YELLOW_CARD_THRESHOLD,
  yellowMax: YELLOW_CARD_THRESHOLD - 1,
}));
const rules = ref({
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

const knockoutRows = computed(() => {
  if (!rules.value.knockoutStagePointsEnabled) return [];
  const pointsByStage = rules.value.knockoutStagePoints || {};
  return knockoutStageKeys
    .map((key) => {
      const stagePoints = pointsByStage[key];
      if (!stagePoints) return null;
      return {
        key,
        stage: t(`help.knockoutScoring.stages.${key}`),
        exact: stagePoints.exactResultPoints,
        goalDiff: stagePoints.goalDifferencePoints,
        tendency: stagePoints.tendencyPoints,
      };
    })
    .filter(Boolean);
});

const points = computed(() => ({
  exact: rules.value.exactResultPoints,
  goalDiff: rules.value.goalDifferencePoints,
  tendency: rules.value.tendencyPoints,
  wrong: rules.value.wrongPredictionPoints,
}));

onMounted(async () => {
  try {
    const { data } = await api.get('/scoring-rules');
    rules.value = data;
  } catch {
    // defaults above
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.rte-rules-header {
  align-items: flex-start;
}

.rte-rules-header__content {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 48rem;
}

.rte-rules-header h1 {
  display: block;
  margin: 0;
  line-height: 1.2;
}

.rte-accent {
  color: var(--color-primary);
}

.rte-eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.rte-subtitle {
  margin: 0.25rem 0 0;
  max-width: 42rem;
}

.help-document .card-body {
  padding: 1.25rem 1.5rem;
}

.help-section {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--color-border);
}

.help-section:first-child {
  padding-top: 0;
}

.help-section--last {
  padding-bottom: 0;
  border-bottom: none;
}

.help-section h2 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--sapTitleColor);
}

.help-section h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
}

.help-section h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.35rem;
}

.help-section p {
  margin: 0;
  line-height: 1.6;
  color: var(--color-text);
}

.help-list {
  margin: 0.75rem 0 0;
  padding-left: 1.25rem;
  line-height: 1.6;
}

.help-knockout-note {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
}

.help-scoring-table-wrap {
  margin-top: 0.75rem;
}

.help-scoring-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.help-scoring-table th,
.help-scoring-table td {
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.help-scoring-table th {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  background: var(--color-bg-elevated, rgba(255, 255, 255, 0.03));
}

.help-scoring-table td:not(:first-child) {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.help-callout {
  margin-top: 1rem;
  padding: 0.875rem 1rem;
  background: var(--color-bg-elevated, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.help-callout h3 {
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
}

.help-callout p {
  margin: 0.2rem 0;
  font-size: 0.875rem;
}

.help-callout--accent {
  font-weight: 600;
  border-left: 3px solid var(--color-primary);
}

.help-variant-grid {
  margin-top: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  font-size: 0.875rem;
}

.help-variant-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 0.55rem 0.875rem;
  border-bottom: 1px solid var(--color-border);
}

.help-variant-row:last-child {
  border-bottom: none;
}

.help-variant-row--head {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  background: var(--color-bg-elevated, rgba(255, 255, 255, 0.03));
}

.help-variant-row--head span:last-child {
  text-align: right;
}

.help-variant-row span:last-child {
  text-align: right;
  white-space: nowrap;
  color: var(--color-text-muted);
}

.help-variant-row--active {
  background: var(--color-primary-soft);
}

.help-variant-row--active span {
  color: var(--color-primary);
  font-weight: 600;
}

.help-variant-note {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
}

.help-section .btn {
  margin-top: 0.75rem;
}
</style>
