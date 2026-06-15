<template>
  <div>
    <div class="page-header">
      <h1>{{ t('adminPages.feedback.title') }}</h1>
      <button class="btn btn-secondary btn-sm" :disabled="loading" @click="load">
        {{ loading ? t('adminPages.feedback.refreshing') : t('adminPages.feedback.refresh') }}
      </button>
    </div>

    <p class="text-muted feedback-intro">{{ t('adminPages.feedback.intro') }}</p>

    <AlertMessage
      v-if="githubConfigLoaded && !githubConfigured"
      :message="t('adminPages.feedback.githubNotConfigured')"
      type="warning"
    />

    <AlertMessage v-if="message" :message="message" type="success" />
    <AlertMessage v-if="error" :message="error" type="error" />

    <div class="filter-bar mb-2">
      <select v-model="filters.status" class="form-control filter-input" @change="load">
        <option value="">{{ t('adminPages.feedback.filterAllStatuses') }}</option>
        <option value="open">{{ t('adminPages.feedback.statusOpen') }}</option>
        <option value="in_progress">{{ t('adminPages.feedback.statusInProgress') }}</option>
        <option value="done">{{ t('adminPages.feedback.statusDone') }}</option>
        <option value="closed">{{ t('adminPages.feedback.statusClosed') }}</option>
      </select>
      <select v-model="filters.type" class="form-control filter-input" @change="load">
        <option value="">{{ t('adminPages.feedback.filterAllTypes') }}</option>
        <option value="bug">{{ t('feedback.typeBug') }}</option>
        <option value="change">{{ t('feedback.typeChange') }}</option>
        <option value="feature">{{ t('feedback.typeFeature') }}</option>
      </select>
      <input
        v-model="filters.q"
        class="form-control filter-search"
        :placeholder="t('adminPages.feedback.searchPlaceholder')"
        @input="onSearchInput"
      />
    </div>

    <LoadingSpinner v-if="loading && !items.length" />

    <div v-else class="card">
      <div class="card-body">
        <p v-if="!items.length" class="text-muted mb-0">{{ t('adminPages.feedback.empty') }}</p>
        <div v-else class="table-responsive">
          <table class="table feedback-table">
            <thead>
              <tr>
                <th>{{ t('adminPages.feedback.colDate') }}</th>
                <th>{{ t('adminPages.feedback.colUser') }}</th>
                <th>{{ t('adminPages.feedback.colType') }}</th>
                <th>{{ t('adminPages.feedback.colTitle') }}</th>
                <th>{{ t('adminPages.feedback.colStatus') }}</th>
                <th>{{ t('adminPages.feedback.colGithub') }}</th>
                <th>{{ t('adminPages.feedback.colActions') }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="item in items" :key="item.id">
                <tr :class="{ expanded: expandedId === item.id }">
                  <td>{{ formatDateTime(item.createdAt) }}</td>
                  <td>
                    <div class="user-cell">
                      <strong>{{ userLabel(item.user) }}</strong>
                      <span v-if="item.user?.email" class="text-muted user-email">{{ item.user.email }}</span>
                      <span v-if="item.user?.team?.name" class="text-muted user-team">{{ item.user.team.name }}</span>
                    </div>
                  </td>
                  <td><span class="type-badge" :class="item.type">{{ typeLabel(item.type) }}</span></td>
                  <td>
                    <button type="button" class="title-toggle" @click="toggleExpanded(item.id)">
                      {{ item.title }}
                    </button>
                  </td>
                  <td><span class="status-badge" :class="item.status">{{ statusLabel(item.status) }}</span></td>
                  <td>
                    <a
                      v-if="item.githubIssueUrl"
                      :href="item.githubIssueUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="github-link"
                    >
                      #{{ item.githubIssueNumber }}
                    </a>
                    <span v-else class="text-muted">–</span>
                  </td>
                  <td class="actions-cell">
                    <button
                      v-if="!item.githubIssueUrl"
                      type="button"
                      class="btn btn-primary btn-sm"
                      :disabled="busyId === item.id"
                      @click="requestApprove(item)"
                    >
                      {{ busyId === item.id ? t('adminPages.feedback.approving') : t('adminPages.feedback.approve') }}
                    </button>
                    <button
                      v-if="item.status !== 'closed'"
                      type="button"
                      class="btn btn-secondary btn-sm"
                      :disabled="busyId === item.id"
                      @click="requestClose(item)"
                    >
                      {{ t('adminPages.feedback.close') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="expandedId === item.id" class="detail-row">
                  <td colspan="7">
                    <div class="feedback-detail">
                      <p class="feedback-description">{{ item.description }}</p>
                      <dl class="feedback-meta">
                        <template v-if="item.pageUrl">
                          <dt>{{ t('adminPages.feedback.pageUrl') }}</dt>
                          <dd><a :href="item.pageUrl" target="_blank" rel="noopener noreferrer">{{ item.pageUrl }}</a></dd>
                        </template>
                        <template v-if="item.appVersion">
                          <dt>{{ t('adminPages.feedback.appVersion') }}</dt>
                          <dd>{{ item.appVersion }}</dd>
                        </template>
                      </dl>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <p v-if="total > items.length" class="text-muted table-footer">
          {{ t('adminPages.feedback.showing', { shown: items.length, total }) }}
        </p>
      </div>
    </div>

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
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../services/api';
import { useFormatters } from '../../composables/useFormatters';
import { useConfirmModal } from '../../composables/useConfirmModal';
import { useToastStore } from '../../stores/toastStore';
import AlertMessage from '../../components/AlertMessage.vue';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import ConfirmModal from '../../components/ConfirmModal.vue';

const { t } = useI18n();
const { formatDateTime } = useFormatters();
const { confirmState, openConfirm, closeConfirm, onConfirm } = useConfirmModal();
const toastStore = useToastStore();

const items = ref([]);
const total = ref(0);
const loading = ref(true);
const busyId = ref(null);
const message = ref('');
const error = ref('');
const expandedId = ref(null);
const githubConfigured = ref(false);
const githubConfigLoaded = ref(false);
const filters = ref({ status: 'open', type: '', q: '' });

let searchTimer;

function userLabel(user) {
  if (!user) return t('adminPages.feedback.unknownUser');
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email || t('adminPages.feedback.unknownUser');
}

function typeLabel(type) {
  if (type === 'bug') return t('feedback.typeBug');
  if (type === 'change') return t('feedback.typeChange');
  if (type === 'feature') return t('feedback.typeFeature');
  return type;
}

function statusLabel(status) {
  const map = {
    open: t('adminPages.feedback.statusOpen'),
    in_progress: t('adminPages.feedback.statusInProgress'),
    done: t('adminPages.feedback.statusDone'),
    closed: t('adminPages.feedback.statusClosed'),
  };
  return map[status] || status;
}

function toggleExpanded(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

function onSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(load, 300);
}

async function loadGithubConfig() {
  try {
    const { data } = await api.get('/admin/feedback/config');
    githubConfigured.value = Boolean(data?.githubConfigured);
  } catch {
    githubConfigured.value = false;
  } finally {
    githubConfigLoaded.value = true;
  }
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const params = { limit: 100 };
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.q.trim()) params.q = filters.value.q.trim();
    const { data } = await api.get('/admin/feedback', { params });
    items.value = data.items || [];
    total.value = data.total || items.value.length;
  } catch (err) {
    error.value = err.response?.data?.error || t('adminPages.feedback.loadFailed');
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function requestApprove(item) {
  openConfirm({
    title: t('adminPages.feedback.approve'),
    message: t('adminPages.feedback.confirmApprove', { title: item.title }),
    confirmLabel: t('adminPages.feedback.approve'),
    action: () => approveItem(item),
  });
}

function requestClose(item) {
  openConfirm({
    title: t('adminPages.feedback.close'),
    message: t('adminPages.feedback.confirmClose', { title: item.title }),
    confirmLabel: t('adminPages.feedback.close'),
    danger: true,
    action: () => closeItem(item),
  });
}

async function approveItem(item) {
  busyId.value = item.id;
  error.value = '';
  message.value = '';
  try {
    const { data } = await api.post(`/admin/feedback/${item.id}/github-issue`);
    message.value = data?.message || t('adminPages.feedback.approveSuccess');
    toastStore.success(message.value);
    if (data?.issueUrl) {
      window.open(data.issueUrl, '_blank', 'noopener,noreferrer');
    }
    await load();
  } catch (err) {
    const base = err.response?.data?.error || t('adminPages.feedback.approveFailed');
    const detail = err.response?.data?.detail;
    error.value = detail ? `${base} (${detail})` : base;
    toastStore.error(error.value);
  } finally {
    busyId.value = null;
  }
}

async function closeItem(item) {
  busyId.value = item.id;
  error.value = '';
  message.value = '';
  try {
    await api.put(`/admin/feedback/${item.id}`, { status: 'closed' });
    message.value = t('adminPages.feedback.closeSuccess');
    await load();
  } catch (err) {
    error.value = err.response?.data?.error || t('adminPages.feedback.closeFailed');
  } finally {
    busyId.value = null;
  }
}

onMounted(async () => {
  await Promise.all([loadGithubConfig(), load()]);
});
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.feedback-intro {
  margin: 0 0 1rem;
  max-width: 42rem;
  line-height: 1.5;
}

.mb-2 { margin-bottom: 1rem; }

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.filter-input { max-width: 11rem; }
.filter-search { flex: 1; min-width: 12rem; max-width: 24rem; }

.feedback-table td { vertical-align: top; }

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 9rem;
}

.user-email,
.user-team {
  font-size: 0.82rem;
}

.title-toggle {
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  color: inherit;
  cursor: pointer;
  font-weight: 500;
}

.title-toggle:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.type-badge,
.status-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.type-badge.bug { background: #fee2e2; color: #991b1b; }
.type-badge.change { background: #fef3c7; color: #92400e; }
.type-badge.feature { background: #dbeafe; color: #1e40af; }

.status-badge.open { background: #e0f2fe; color: #075985; }
.status-badge.in_progress { background: #fef3c7; color: #92400e; }
.status-badge.done { background: #dcfce7; color: #166534; }
.status-badge.closed { background: #f3f4f6; color: #4b5563; }

.github-link {
  font-weight: 600;
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-width: 10rem;
}

.detail-row td {
  background: var(--color-surface-muted, #f8fafc);
  border-top: none;
}

.feedback-detail {
  padding: 0.25rem 0 0.5rem;
}

.feedback-description {
  margin: 0 0 0.75rem;
  white-space: pre-wrap;
  line-height: 1.55;
}

.feedback-meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 1rem;
  margin: 0;
  font-size: 0.9rem;
}

.feedback-meta dt {
  margin: 0;
  font-weight: 600;
}

.feedback-meta dd {
  margin: 0;
  word-break: break-all;
}

.table-footer {
  margin: 1rem 0 0;
  font-size: 0.85rem;
}
</style>
