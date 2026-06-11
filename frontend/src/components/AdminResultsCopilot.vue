<template>
  <div :class="['results-copilot', { 'results-copilot--compact': compact }]">
    <div v-if="!compact" class="results-copilot-toolbar">
      <div class="mode-toggle">
        <button
          type="button"
          :class="['filter-btn', { active: dayOffset === -1 }]"
          @click="setDayOffset(-1)"
        >
          {{ t('adminPages.resultsCopilot.dayYesterday') }}
        </button>
        <button
          type="button"
          :class="['filter-btn', { active: dayOffset === 0 }]"
          @click="setDayOffset(0)"
        >
          {{ t('adminPages.resultsCopilot.dayToday') }}
        </button>
        <button
          type="button"
          :class="['filter-btn', { active: dayOffset === 1 }]"
          @click="setDayOffset(1)"
        >
          {{ t('adminPages.resultsCopilot.dayTomorrow') }}
        </button>
        <button
          type="button"
          :class="['filter-btn', { active: mode === 'list' }]"
          @click="mode = 'list'"
        >
          {{ t('adminPages.resultsCopilot.modeList') }}
        </button>
        <button
          type="button"
          :class="['filter-btn', { active: mode === 'wizard' }]"
          @click="switchToWizard"
        >
          {{ t('adminPages.resultsCopilot.modeWizard') }}
        </button>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" :disabled="loading" @click="loadMatches">
        {{ t('adminPages.resultsCopilot.refresh') }}
      </button>
    </div>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="loadError" :message="loadError" @retry="loadMatches" />
    <AlertMessage v-if="message" :message="message" type="success" />
    <AlertMessage v-if="error" :message="error" type="error" />

    <template v-else>
      <p v-if="!compact" class="results-copilot-summary text-muted">
        {{ t('adminPages.resultsCopilot.summary', { pending: pendingMatches.length, finished: finishedMatches.length, date: dateStr }) }}
      </p>

      <div v-if="!compact && pendingMatches.length" class="results-copilot-bulk card mb-2">
        <div class="card-body">
          <div class="results-copilot-bulk-header">
            <strong>{{ t('adminPages.resultsCopilot.bulk.title') }}</strong>
            <span class="text-muted">{{ t('adminPages.resultsCopilot.bulk.hint') }}</span>
          </div>
          <form class="results-copilot-bulk-row" @submit.prevent="applyBulk">
            <textarea
              v-model="bulkInput"
              class="form-control results-copilot-bulk-textarea"
              rows="3"
              :placeholder="t('adminPages.resultsCopilot.bulk.placeholder')"
              :disabled="bulkSaving"
            />
            <button type="submit" class="btn btn-primary" :disabled="bulkSaving || !bulkInput.trim()">
              {{ bulkSaving ? t('common.saving') : t('adminPages.resultsCopilot.bulk.apply') }}
            </button>
          </form>
          <p v-if="bulkError" class="text-muted results-copilot-bulk-error">{{ bulkError }}</p>
        </div>
      </div>

      <div v-if="pendingMatches.length === 0 && finishedMatches.length === 0" class="results-copilot-empty">
        <EmptyState
          icon="📅"
          :message="t('adminPages.resultsCopilot.noMatchesForDay', { date: dateStr })"
        />
      </div>

      <div v-else-if="pendingMatches.length === 0" class="results-copilot-done">
        <p>{{ t('adminPages.resultsCopilot.allDone') }}</p>
        <ul v-if="finishedMatches.length" class="results-copilot-finished-list">
          <li v-for="match in visibleFinished" :key="match.id">
            <span class="match-ref">#{{ match.matchNumber }}</span>
            {{ match.homeTeam }} {{ match.homeScore }}:{{ match.awayScore }} {{ match.awayTeam }}
          </li>
        </ul>
      </div>

      <template v-else>
        <div v-if="mode === 'wizard' && !compact" class="results-copilot-wizard card">
          <div class="card-body">
            <div class="wizard-progress">
              {{ t('adminPages.resultsCopilot.wizardProgress', {
                current: wizardIndex + 1,
                total: pendingMatches.length,
              }) }}
            </div>

            <div v-if="currentWizardMatch" class="wizard-match">
              <span class="match-ref">#{{ currentWizardMatch.matchNumber }}</span>
              <span :class="['badge', `badge-${currentWizardMatch.status}`]">
                {{ statusLabel(currentWizardMatch.status) }}
              </span>
              <div class="wizard-teams">
                <strong>{{ currentWizardMatch.homeTeam }}</strong>
                <span class="wizard-vs">{{ t('common.vs') }}</span>
                <strong>{{ currentWizardMatch.awayTeam }}</strong>
              </div>
              <div class="wizard-kickoff text-muted">
                {{ formatTime(currentWizardMatch.kickoffTime) }}
              </div>

              <form class="wizard-input-row" @submit.prevent="saveWizard">
                <input
                  ref="wizardInputRef"
                  v-model="wizardInput"
                  type="text"
                  inputmode="numeric"
                  class="form-control wizard-score-input"
                  :placeholder="t('adminPages.resultsCopilot.scorePlaceholder')"
                  :disabled="savingId === currentWizardMatch.id"
                  autocomplete="off"
                  @keydown.enter.prevent="saveWizard"
                />
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="savingId === currentWizardMatch.id || !wizardInput.trim()"
                >
                  {{ savingId === currentWizardMatch.id ? t('common.saving') : t('common.save') }}
                </button>
              </form>
            </div>
          </div>
        </div>

        <ul v-else class="results-copilot-list">
          <li
            v-for="match in visiblePending"
            :key="match.id"
            :class="['results-copilot-item', { 'results-copilot-item--saved': savedIds.has(match.id) }]"
          >
            <div class="results-copilot-meta">
              <span class="match-ref">#{{ match.matchNumber }}</span>
              <span :class="['badge', `badge-${match.status}`]">{{ statusLabel(match.status) }}</span>
              <span class="results-copilot-kickoff">{{ formatTime(match.kickoffTime) }}</span>
            </div>
            <div class="results-copilot-teams">
              <strong>{{ match.homeTeam }}</strong>
              <span>{{ t('common.vs') }}</span>
              <strong>{{ match.awayTeam }}</strong>
            </div>
            <form class="results-copilot-input-row" @submit.prevent="saveListMatch(match)">
              <input
                :ref="(el) => setInputRef(match.id, el)"
                v-model="listInputs[match.id]"
                type="text"
                inputmode="numeric"
                class="form-control results-copilot-score-input"
                :placeholder="t('adminPages.resultsCopilot.scorePlaceholder')"
                :disabled="savingId === match.id"
                autocomplete="off"
              />
              <button
                type="submit"
                class="btn btn-primary btn-sm"
                :disabled="savingId === match.id || !listInputs[match.id]?.trim()"
              >
                {{ savingId === match.id ? t('common.saving') : t('common.save') }}
              </button>
            </form>
          </li>
        </ul>

        <div v-if="compact && pendingMatches.length > visiblePending.length" class="results-copilot-more">
          <router-link to="/admin/results-copilot" class="btn btn-secondary btn-sm">
            {{ t('adminPages.resultsCopilot.showAll', { count: pendingMatches.length }) }}
          </router-link>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import {
  ref, reactive, computed, watch, nextTick, onMounted,
} from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import { parseScoreInput } from '../utils/parseScoreInput';
import { useFormatters } from '../composables/useFormatters';
import LoadingSpinner from './LoadingSpinner.vue';
import AlertMessage from './AlertMessage.vue';
import ErrorState from './ErrorState.vue';
import EmptyState from './EmptyState.vue';

const props = defineProps({
  compact: { type: Boolean, default: false },
  compactLimit: { type: Number, default: 3 },
});

const { t } = useI18n();
const { formatTime } = useFormatters();

const loading = ref(true);
const loadError = ref('');
const message = ref('');
const error = ref('');
const mode = ref('list');
const dayOffset = ref(0);
const dateStr = ref('');
const bulkInput = ref('');
const bulkSaving = ref(false);
const bulkError = ref('');
const pendingMatches = ref([]);
const finishedMatches = ref([]);
const listInputs = reactive({});
const wizardInput = ref('');
const wizardIndex = ref(0);
const savingId = ref(null);
const savedIds = ref(new Set());
const inputRefs = ref({});
const wizardInputRef = ref(null);

const visiblePending = computed(() => (
  props.compact
    ? pendingMatches.value.slice(0, props.compactLimit)
    : pendingMatches.value
));

const visibleFinished = computed(() => (
  props.compact
    ? finishedMatches.value.slice(0, props.compactLimit)
    : finishedMatches.value
));

const currentWizardMatch = computed(() => pendingMatches.value[wizardIndex.value] || null);

function setInputRef(matchId, el) {
  if (el) inputRefs.value[matchId] = el;
}

function statusLabel(status) {
  return t(`adminPages.results.statusLabels.${status}`, status);
}

function resolveTargetMatch(parsed, fallbackMatch) {
  if (parsed.matchNumber == null) return fallbackMatch;
  return pendingMatches.value.find((m) => m.matchNumber === parsed.matchNumber) || fallbackMatch;
}

function formatError(parseResult) {
  if (parseResult.error === 'invalidFormat') {
    return t('adminPages.resultsCopilot.errors.invalidFormat');
  }
  if (parseResult.error === 'outOfRange') {
    return t('adminPages.resultsCopilot.errors.outOfRange', { max: parseResult.max });
  }
  return t('adminPages.resultsCopilot.errors.invalidFormat');
}

async function saveResult(match, rawInput) {
  const parsed = parseScoreInput(rawInput);
  if (!parsed.ok) {
    error.value = formatError(parsed);
    return false;
  }

  const target = resolveTargetMatch(parsed, match);
  if (!target) {
    error.value = t('adminPages.resultsCopilot.errors.matchNotFound', { number: parsed.matchNumber });
    return false;
  }

  savingId.value = target.id;
  error.value = '';
  message.value = '';
  const previousIdx = pendingMatches.value.findIndex((m) => m.id === match.id);

  try {
    await api.post(`/matches/${target.id}/result`, {
      homeScore: parsed.homeScore,
      awayScore: parsed.awayScore,
    });

    savedIds.value = new Set([...savedIds.value, target.id]);
    pendingMatches.value = pendingMatches.value.filter((m) => m.id !== target.id);
    finishedMatches.value = [
      ...finishedMatches.value,
      {
        ...target,
        homeScore: parsed.homeScore,
        awayScore: parsed.awayScore,
        status: 'finished',
      },
    ].sort((a, b) => new Date(a.kickoffTime) - new Date(b.kickoffTime));

    delete listInputs[target.id];
    message.value = t('adminPages.resultsCopilot.saved', {
      home: target.homeTeam,
      away: target.awayTeam,
      score: `${parsed.homeScore}:${parsed.awayScore}`,
    });

    if (mode.value === 'wizard') {
      wizardInput.value = '';
      if (wizardIndex.value >= pendingMatches.value.length) {
        wizardIndex.value = Math.max(0, pendingMatches.value.length - 1);
      }
      await nextTick();
      wizardInputRef.value?.focus();
    } else {
      focusNextPending(previousIdx);
    }

    return true;
  } catch (err) {
    error.value = err.response?.data?.error || t('adminPages.results.saveFailed');
    return false;
  } finally {
    savingId.value = null;
  }
}

async function saveListMatch(match) {
  const raw = listInputs[match.id];
  const ok = await saveResult(match, raw);
  if (ok) listInputs[match.id] = '';
}

async function saveWizard() {
  if (!currentWizardMatch.value) return;
  await saveResult(currentWizardMatch.value, wizardInput.value);
}

function focusNextPending(previousIdx) {
  const next = pendingMatches.value[previousIdx] ?? pendingMatches.value[0];
  if (next) {
    nextTick(() => inputRefs.value[next.id]?.focus());
  }
}

function switchToWizard() {
  mode.value = 'wizard';
  wizardIndex.value = 0;
  wizardInput.value = '';
  nextTick(() => wizardInputRef.value?.focus());
}

function setDayOffset(nextOffset) {
  dayOffset.value = nextOffset;
  loadMatches();
}

async function applyBulk() {
  bulkError.value = '';
  const lines = bulkInput.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return;

  bulkSaving.value = true;
  try {
    const errors = [];
    for (const line of lines) {
      const parsed = parseScoreInput(line);
      if (!parsed.ok || parsed.matchNumber == null) {
        errors.push(`${line} → ${t('adminPages.resultsCopilot.bulk.lineInvalid')}`);
        continue;
      }
      const match = pendingMatches.value.find((m) => m.matchNumber === parsed.matchNumber);
      if (!match) {
        errors.push(`${line} → ${t('adminPages.resultsCopilot.bulk.matchNotFound', { number: parsed.matchNumber })}`);
        continue;
      }
      // Use the normal save path so points, snapshot & sockets are handled server-side.
      // (saveResult also removes from pending list on success)
      const ok = await saveResult(match, `${parsed.homeScore}:${parsed.awayScore}`);
      if (!ok) errors.push(`${line} → ${t('adminPages.resultsCopilot.bulk.saveFailed')}`);
    }

    if (errors.length) {
      bulkError.value = errors.slice(0, 5).join('\n');
    } else {
      bulkInput.value = '';
    }
  } finally {
    bulkSaving.value = false;
  }
}

async function loadMatches() {
  loading.value = true;
  loadError.value = '';
  message.value = '';
  error.value = '';

  try {
    const { data } = await api.get('/admin/matches/today-for-results', { params: { offset: dayOffset.value } });
    pendingMatches.value = data.pending || [];
    finishedMatches.value = data.finished || [];
    dateStr.value = data.date || '';
    savedIds.value = new Set();
    wizardIndex.value = 0;
    wizardInput.value = '';

    for (const match of pendingMatches.value) {
      if (!(match.id in listInputs)) listInputs[match.id] = '';
    }
  } catch (err) {
    loadError.value = err.response?.data?.error || t('adminPages.resultsCopilot.loadFailed');
  } finally {
    loading.value = false;
  }
}

watch(currentWizardMatch, (match) => {
  if (match && mode.value === 'wizard') {
    nextTick(() => wizardInputRef.value?.focus());
  }
});

onMounted(loadMatches);
</script>

<style scoped>
.results-copilot-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.mode-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.results-copilot-summary {
  margin: 0 0 1rem;
}

.results-copilot-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.results-copilot-item {
  display: grid;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.results-copilot-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.match-ref {
  font-weight: 700;
  color: var(--color-primary);
}

.results-copilot-kickoff {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.results-copilot-teams {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
}

.results-copilot-input-row,
.wizard-input-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.results-copilot-score-input {
  width: 7rem;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
}

.wizard-score-input {
  flex: 1;
  min-width: 8rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.results-copilot-wizard {
  margin-bottom: 1rem;
}

.wizard-progress {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.wizard-match {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.wizard-teams {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.5rem 0.75rem;
  font-size: 1.25rem;
}

.wizard-vs {
  color: var(--color-text-muted);
}

.wizard-input-row {
  width: 100%;
  max-width: 24rem;
  margin-top: 0.5rem;
}

.results-copilot-finished-list {
  margin: 0.75rem 0 0;
  padding-left: 1.25rem;
}

.results-copilot-more {
  margin-top: 0.75rem;
}

.results-copilot--compact .results-copilot-item {
  padding: 0.65rem 0.85rem;
}

.results-copilot-done p {
  margin: 0;
  color: var(--color-text-muted);
}

.results-copilot-bulk-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.results-copilot-bulk-row {
  display: grid;
  gap: 0.5rem;
}

.results-copilot-bulk-textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.results-copilot-bulk-error {
  margin: 0.5rem 0 0;
  white-space: pre-line;
}
</style>
