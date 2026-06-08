<template>
  <div class="card">
    <div class="card-body">
      <p class="text-muted">{{ t('nationalTeams.duelsHint') }}</p>
      <div class="duels-select-row">
        <div class="form-group">
          <label>{{ t('nationalTeams.duelsTeamA') }}</label>
          <select :value="duelTeamAId" class="form-control" @change="$emit('update:duelTeamAId', toId($event.target.value))">
            <option :value="null">{{ t('nationalTeams.duelsSelectTeam') }}</option>
            <option v-for="team in teams" :key="`a-${team.id}`" :value="team.id">
              {{ team.name }}
            </option>
          </select>
        </div>
        <span class="duels-vs">{{ t('common.vs') }}</span>
        <div class="form-group">
          <label>{{ t('nationalTeams.duelsTeamB') }}</label>
          <select :value="duelTeamBId" class="form-control" @change="$emit('update:duelTeamBId', toId($event.target.value))">
            <option :value="null">{{ t('nationalTeams.duelsSelectTeam') }}</option>
            <option v-for="team in teams" :key="`b-${team.id}`" :value="team.id">
              {{ team.name }}
            </option>
          </select>
        </div>
        <button
          type="button"
          class="btn btn-primary duels-compare-btn"
          :disabled="!canCompare || duelLoading"
          @click="$emit('compare')"
        >
          {{ duelLoading ? t('head2head.loading') : t('nationalTeams.duelsCompare') }}
        </button>
      </div>

      <HeadToHeadPanel
        v-if="duelData"
        :data="duelData"
        :loading="duelLoading"
        :subtitle="t('head2head.wcOnly')"
      />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import HeadToHeadPanel from '../HeadToHeadPanel.vue';

defineProps({
  teams: { type: Array, default: () => [] },
  duelTeamAId: { type: [Number, null], default: null },
  duelTeamBId: { type: [Number, null], default: null },
  canCompare: { type: Boolean, default: false },
  duelLoading: { type: Boolean, default: false },
  duelData: { type: Object, default: null },
});

defineEmits(['update:duelTeamAId', 'update:duelTeamBId', 'compare']);

const { t } = useI18n();

function toId(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
</script>

<style scoped>
.duels-select-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 0.75rem;
  align-items: end;
  margin-bottom: 1.25rem;
}

.duels-vs {
  font-weight: 700;
  padding-bottom: 0.5rem;
}

.duels-compare-btn {
  white-space: nowrap;
}

@media (max-width: 900px) {
  .duels-select-row {
    grid-template-columns: 1fr;
  }
  .duels-vs {
    text-align: center;
    padding-bottom: 0;
  }
}
</style>
