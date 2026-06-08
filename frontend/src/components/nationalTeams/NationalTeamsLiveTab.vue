<template>
  <div>
    <div class="filter-bar mb-3">
      <button
        v-for="f in matchFilters"
        :key="f.value"
        type="button"
        :class="['filter-btn', { active: liveFilter === f.value }]"
        :aria-pressed="liveFilter === f.value"
        @click="$emit('set-filter', f.value)"
      >
        {{ f.label }}
      </button>
    </div>
    <LoadingSpinner v-if="loading" />
    <div v-else-if="liveMatches.length === 0" class="empty-state">
      <p>{{ t('nationalTeams.liveEmpty') }}</p>
    </div>
    <div v-else class="card">
      <div class="card-body">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{{ t('matchTable.date') }}</th>
                <th>{{ t('matchTable.stage') }}</th>
                <th>{{ t('matchTable.home') }}</th>
                <th>{{ t('matchTable.result') }}</th>
                <th>{{ t('matchTable.away') }}</th>
                <th>{{ t('matchTable.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="match in liveMatches" :key="match.id">
                <td>{{ formatDateTime(match.utcDate) }}</td>
                <td>{{ match.stage }}<span v-if="match.group"> ({{ match.group }})</span></td>
                <td>
                  <router-link :to="{ path: '/national-teams', query: { team: match.homeTeam.name, tab: 'teams' } }">
                    {{ match.homeTeam.name }}
                  </router-link>
                </td>
                <td>
                  <span v-if="match.score.home != null">{{ match.score.home }} : {{ match.score.away }}</span>
                  <span v-else>–</span>
                </td>
                <td>
                  <router-link :to="{ path: '/national-teams', query: { team: match.awayTeam.name, tab: 'teams' } }">
                    {{ match.awayTeam.name }}
                  </router-link>
                </td>
                <td><span class="badge badge-info">{{ match.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import LoadingSpinner from '../LoadingSpinner.vue';

defineProps({
  loading: { type: Boolean, default: false },
  liveMatches: { type: Array, default: () => [] },
  liveFilter: { type: String, default: 'today' },
  matchFilters: { type: Array, default: () => [] },
  formatDateTime: { type: Function, required: true },
});

defineEmits(['set-filter']);

const { t } = useI18n();
</script>
