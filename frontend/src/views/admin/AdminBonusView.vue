<template>
  <div>
    <div class="page-header">
      <h1>{{ t('adminPages.bonus.title') }}</h1>
      <button class="btn btn-primary btn-sm" @click="openCreate">+ {{ t('adminPages.bonus.newQuestion') }}</button>
    </div>

    <AlertMessage v-if="message" :message="message" type="success" />

    <div class="card mb-2"><div class="card-body"><AIBonusQuestionSuggestions @use="applySuggestion" /></div></div>

    <LoadingSpinner v-if="loading" />

    <div v-else class="card"><div class="card-body">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in questions" :key="q.id">
              <td>{{ q.questionText }}</td>
              <td>{{ typeLabel(q.questionType) }}</td>
              <td>{{ q.points }}</td>
              <td>{{ q.status }}</td>
              <td>{{ q.lockTime ? formatDateTime(q.lockTime) : '–' }}</td>
              <td>
                <div class="btn-group">
                  <button class="btn btn-secondary btn-sm" @click="openResolve(q)">{{ t('adminPages.bonus.resolve') }}</button>
                  <button class="btn btn-danger btn-sm" @click="requestDelete(q)">{{ t('common.delete') }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div></div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-label="modalMode === 'create' ? t('adminPages.bonus.createTitle') : t('adminPages.bonus.resolveTitle')"
        >
          <div class="modal-header">
            <h3>{{ modalMode === 'create' ? t('adminPages.bonus.createTitle') : t('adminPages.bonus.resolveTitle') }}</h3>
            <button type="button" class="modal-close" :aria-label="t('common.close')" @click="closeModal">&times;</button>
          </div>
          <form @submit.prevent="handleSave">
            <div class="modal-body">
              <template v-if="modalMode === 'create'">
                <div class="form-group">
                  <label>{{ t('adminPages.bonus.form.question') }}</label>
                  <input v-model="form.questionText" class="form-control" required />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>{{ t('adminPages.bonus.form.type') }}</label>
                    <select v-model="form.questionType" class="form-control">
                      <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>{{ t('adminPages.bonus.form.points') }}</label>
                    <input v-model.number="form.points" type="number" class="form-control" />
                  </div>
                </div>
                <div v-if="form.questionType === 'single_choice' || form.questionType === 'favorite_team_progress'" class="form-group">
                  <label>{{ t('adminPages.bonus.form.options') }}</label>
                  <input
                    v-model="form.optionsStr"
                    class="form-control"
                    :placeholder="form.questionType === 'favorite_team_progress'
                      ? t('adminPages.bonus.form.optionsPlaceholderProgress')
                      : t('adminPages.bonus.form.optionsPlaceholderTeam')"
                  />
                  <p v-if="form.questionType === 'favorite_team_progress'" class="text-muted api-hint">
                    {{ t('adminPages.bonus.form.favoriteTeamHint') }}
                  </p>
                </div>
                <p v-else-if="usesApiOptions(form.questionType)" class="text-muted api-hint">
                  {{ t('adminPages.bonus.form.apiOptionsHint') }}
                </p>
                <div class="form-group">
                  <label>{{ t('adminPages.bonus.form.lockTime') }}</label>
                  <input v-model="form.lockTime" type="datetime-local" class="form-control" />
                </div>
              </template>
              <template v-else>
                <p>{{ resolvingQuestion?.questionText }}</p>
                <div v-if="resolvingQuestion?.questionType === 'national_team'" class="form-group">
                  <label>{{ t('adminPages.bonus.form.correctTeam') }}</label>
                  <input v-model="resolveTeamSearch" type="search" class="form-control mb-2" :placeholder="t('adminPages.bonus.form.searchTeam')" />
                  <select v-model="form.resolveTeamId" class="form-control" required>
                    <option :value="null">{{ t('adminPages.bonus.form.pleaseSelect') }}</option>
                    <option v-for="team in filteredResolveTeams" :key="team.id" :value="team.id">{{ team.name }}</option>
                  </select>
                </div>
                <div v-else-if="resolvingQuestion?.questionType === 'national_team_player'" class="form-group">
                  <label>{{ t('adminPages.bonus.form.correctPlayer') }}</label>
                  <input v-model="resolvePlayerSearch" type="search" class="form-control mb-2" :placeholder="t('adminPages.bonus.form.searchPlayer')" />
                  <select v-model="form.resolvePlayerId" class="form-control" required size="8">
                    <option :value="null">{{ t('adminPages.bonus.form.pleaseSelect') }}</option>
                    <option v-for="player in filteredResolvePlayers" :key="player.id" :value="player.id">
                      {{ player.name }} ({{ player.teamName }})
                    </option>
                  </select>
                </div>
                <div v-else class="form-group">
                  <label>{{ t('adminPages.bonus.form.correctAnswer') }}</label>
                  <input v-model="form.correctAnswer" class="form-control" required />
                </div>
              </template>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn-primary">{{ t('common.save') }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <ConfirmModal
      :open="confirmState.open"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-label="confirmState.confirmLabel"
      :danger="confirmState.danger"
      @confirm="onConfirm"
      @cancel="closeConfirm"
    />
  </div>
</template>

<script setup>
import {
  ref, computed, onMounted, onUnmounted,
} from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import AlertMessage from '../../components/AlertMessage.vue';
import AIBonusQuestionSuggestions from '../../components/AIBonusQuestionSuggestions.vue';
import ConfirmModal from '../../components/ConfirmModal.vue';
import { useConfirmModal } from '../../composables/useConfirmModal';

const { t, locale } = useI18n();
const { confirmState, openConfirm, closeConfirm, onConfirm } = useConfirmModal();

const questions = ref([]);
const loading = ref(true);
const showModal = ref(false);
const modalMode = ref('create');
const resolvingQuestion = ref(null);
const message = ref('');
const resolveTeamSearch = ref('');
const resolvePlayerSearch = ref('');

const form = ref({
  questionText: '',
  questionType: 'single_choice',
  points: 10,
  optionsStr: '',
  lockTime: '',
  correctAnswer: '',
  resolveTeamId: null,
  resolvePlayerId: null,
});

const columns = computed(() => [
  { key: 'question', label: t('adminPages.bonus.columns.question') },
  { key: 'type', label: t('adminPages.bonus.columns.type') },
  { key: 'points', label: t('adminPages.bonus.columns.points') },
  { key: 'status', label: t('adminPages.bonus.columns.status') },
  { key: 'lockTime', label: t('adminPages.bonus.columns.lockTime') },
  { key: 'actions', label: t('adminPages.bonus.columns.actions') },
]);

const typeOptions = computed(() => [
  { value: 'single_choice', label: t('adminPages.bonus.typeOptions.single_choice') },
  { value: 'national_team', label: t('adminPages.bonus.typeOptions.national_team') },
  { value: 'national_team_player', label: t('adminPages.bonus.typeOptions.national_team_player') },
  { value: 'favorite_team_progress', label: t('adminPages.bonus.typeOptions.favorite_team_progress') },
  { value: 'number', label: t('adminPages.bonus.typeOptions.number') },
  { value: 'text', label: t('adminPages.bonus.typeOptions.text') },
]);

const filteredResolveTeams = computed(() => {
  const teams = resolvingQuestion.value?.teamOptions || [];
  const q = resolveTeamSearch.value.trim().toLowerCase();
  if (!q) return teams;
  return teams.filter((team) => team.name.toLowerCase().includes(q));
});

const filteredResolvePlayers = computed(() => {
  const players = resolvingQuestion.value?.playerOptions || [];
  const q = resolvePlayerSearch.value.trim().toLowerCase();
  const filtered = q
    ? players.filter((p) => p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q))
    : players;
  return filtered.slice(0, 200);
});

function closeModal() {
  showModal.value = false;
}

function onKeydown(event) {
  if (event.key === 'Escape' && showModal.value) closeModal();
}

function formatDateTime(value) {
  return new Date(value).toLocaleString(locale.value);
}

function usesApiOptions(type) {
  return type === 'national_team' || type === 'national_team_player';
}

function typeLabel(type) {
  return t(`adminPages.bonus.types.${type}`, type);
}

async function load() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/bonus-questions');
    questions.value = data;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  modalMode.value = 'create';
  form.value = {
    questionText: '',
    questionType: 'single_choice',
    points: 10,
    optionsStr: '',
    lockTime: '',
    correctAnswer: '',
    resolveTeamId: null,
    resolvePlayerId: null,
  };
  showModal.value = true;
}

function applySuggestion(s) {
  modalMode.value = 'create';
  form.value = {
    questionText: s.questionText,
    questionType: s.questionType || 'single_choice',
    points: s.suggestedPoints || 10,
    optionsStr: (s.options || []).join(', '),
    lockTime: '',
    correctAnswer: '',
    resolveTeamId: null,
    resolvePlayerId: null,
  };
  showModal.value = true;
}

async function openResolve(q) {
  modalMode.value = 'resolve';
  resolvingQuestion.value = q.teamOptions || q.playerOptions ? q : (await api.get(`/admin/bonus-questions/${q.id}`)).data;
  resolveTeamSearch.value = '';
  resolvePlayerSearch.value = '';
  form.value.correctAnswer = '';
  form.value.resolveTeamId = null;
  form.value.resolvePlayerId = null;
  showModal.value = true;
}

function buildCorrectAnswer() {
  if (resolvingQuestion.value?.questionType === 'national_team') {
    const team = (resolvingQuestion.value.teamOptions || []).find((item) => item.id === form.value.resolveTeamId);
    return team ? { id: team.id, name: team.name } : null;
  }
  if (resolvingQuestion.value?.questionType === 'national_team_player') {
    const player = (resolvingQuestion.value.playerOptions || []).find((item) => item.id === form.value.resolvePlayerId);
    return player ? { id: player.id, name: player.name, teamName: player.teamName } : null;
  }
  return form.value.correctAnswer;
}

async function handleSave() {
  if (modalMode.value === 'create') {
    const options = form.value.optionsStr ? form.value.optionsStr.split(',').map((s) => s.trim()) : [];
    await api.post('/admin/bonus-questions', {
      questionText: form.value.questionText,
      questionType: form.value.questionType,
      points: form.value.points,
      options: usesApiOptions(form.value.questionType) ? null : options,
      lockTime: form.value.lockTime ? new Date(form.value.lockTime).toISOString() : null,
    });
    message.value = t('adminPages.bonus.created');
  } else {
    await api.post(`/admin/bonus-questions/${resolvingQuestion.value.id}/resolve`, {
      correctAnswer: buildCorrectAnswer(),
    });
    message.value = t('adminPages.bonus.resolved');
  }
  showModal.value = false;
  await load();
}

function requestDelete(q) {
  openConfirm({
    title: t('common.delete'),
    message: t('adminPages.bonus.confirmDelete'),
    confirmLabel: t('common.delete'),
    danger: true,
    action: () => handleDelete(q),
  });
}

async function handleDelete(q) {
  await api.delete(`/admin/bonus-questions/${q.id}`);
  await load();
}

onMounted(() => {
  load();
  globalThis.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  globalThis.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.api-hint {
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
.mb-2 { margin-bottom: 1.5rem; }
</style>
