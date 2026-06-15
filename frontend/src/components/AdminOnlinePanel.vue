<template>
  <div class="card mb-2">
    <div class="card-header">
      <h3>
        <span class="online-dot" aria-hidden="true" />
        {{ t('adminPages.dashboard.presence.title', { count }) }}
      </h3>
    </div>
    <div class="card-body">
      <LoadingSpinner v-if="loading && !loadedOnce" />
      <p v-else-if="!count" class="text-muted">{{ t('adminPages.dashboard.presence.empty') }}</p>
      <template v-else>
        <div v-for="group in byTeam" :key="group.teamName" class="presence-team">
          <div class="presence-team-label">
            {{ group.teamName }}
            <span class="presence-team-count">({{ group.count }})</span>
          </div>
          <ul class="presence-list">
            <li v-for="user in group.members" :key="user.id" class="presence-item">
              <UserAvatar
                :image-url="user.imageUrl"
                :avatar-color="user.avatarColor"
                :avatar-emoji="user.avatarEmoji"
                :first-name="user.firstName"
                :last-name="user.lastName"
                size="sm"
              />
              <span class="presence-name">
                {{ displayName(user) }}
                <span v-if="user.role === 'admin'" class="presence-badge">Admin</span>
              </span>
            </li>
          </ul>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner.vue';
import UserAvatar from './UserAvatar.vue';

const { t } = useI18n();

const loading = ref(true);
const loadedOnce = ref(false);
const count = ref(0);
const byTeam = ref([]);
let pollTimer = null;

function displayName(user) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || `#${user.id}`;
}

async function loadPresence() {
  try {
    const { data } = await api.get('/admin/presence');
    count.value = data.count || 0;
    byTeam.value = data.byTeam || [];
    loadedOnce.value = true;
  } catch {
    if (!loadedOnce.value) {
      count.value = 0;
      byTeam.value = [];
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPresence();
  pollTimer = setInterval(loadPresence, 60_000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.mb-2 { margin-bottom: 1.5rem; }
.online-dot {
  display: inline-block;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #22c55e;
  margin-right: 0.4rem;
  vertical-align: middle;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
}
.presence-team + .presence-team { margin-top: 1rem; }
.presence-team-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted, #8892a4);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.presence-team-count { font-weight: 500; }
.presence-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}
.presence-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}
.presence-name {
  font-size: 0.9rem;
}
.presence-badge {
  font-size: 0.7rem;
  margin-left: 0.35rem;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}
</style>
