<template>
  <LoadingSpinner v-if="loading" />
  <div v-else-if="scorers.length === 0" class="empty-state">
    <p>{{ t('nationalTeams.scorersEmpty') }}</p>
  </div>
  <div v-else>
    <section v-if="topScorers.length" class="top-scorers-podium card mb-3">
      <div class="card-header">
        <h3>{{ t('nationalTeams.topScorersTitle') }}</h3>
        <span v-if="sourceLabel" class="text-muted top-scorers-source">{{ sourceLabel }}</span>
      </div>
      <div class="card-body">
        <ol class="top-scorers-list">
          <li
            v-for="(entry, idx) in topScorers"
            :key="entry.player.id || `${entry.player.name}-${idx}`"
            class="top-scorers-item"
            :class="`top-scorers-item--${idx + 1}`"
          >
            <span class="top-scorers-rank">{{ idx + 1 }}</span>
            <PlayerAvatar
              :image-url="entry.player.imageUrl"
              :name="entry.player.name"
              :attribution-text="entry.player.imageAttribution"
              :image-source="entry.player.imageSource"
              size="sm"
            />
            <div class="top-scorers-meta">
              <strong>{{ entry.player.name }}</strong>
              <span class="text-muted">{{ entry.team.name || '–' }}</span>
            </div>
            <span class="top-scorers-goals">{{ entry.goals }} {{ t('nationalTeams.goals') }}</span>
          </li>
        </ol>
      </div>
    </section>

    <div class="card">
      <div class="card-body">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{{ t('nationalTeams.player') }}</th>
                <th>{{ t('nationalTeams.team') }}</th>
                <th>{{ t('nationalTeams.goals') }}</th>
                <th>{{ t('nationalTeams.assists') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, idx) in scorers" :key="entry.player.id || idx">
                <td>{{ idx + 1 }}</td>
                <td>
                  <div class="player-name-cell">
                    <PlayerAvatar
                      :image-url="entry.player.imageUrl"
                      :name="entry.player.name"
                      :attribution-text="entry.player.imageAttribution"
                      :image-source="entry.player.imageSource"
                      size="xs"
                    />
                    <strong>{{ entry.player.name }}</strong>
                  </div>
                </td>
                <td>
                  <span class="standing-team">
                    <img v-if="entry.team.crest" :src="entry.team.crest" :alt="entry.team.name" class="standing-crest" loading="lazy" decoding="async" />
                    {{ entry.team.name }}
                  </span>
                </td>
                <td>{{ entry.goals }}</td>
                <td>{{ entry.assists ?? '–' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import LoadingSpinner from '../LoadingSpinner.vue';
import PlayerAvatar from '../PlayerAvatar.vue';

const props = defineProps({
  loading: { type: Boolean, default: false },
  scorers: { type: Array, default: () => [] },
  topScorers: { type: Array, default: () => [] },
  source: { type: String, default: 'none' },
});

const { t } = useI18n();

const sourceLabel = computed(() => {
  if (props.source === 'football-data') return t('nationalTeams.topScorersSourceFootball');
  if (props.source === 'thesportsdb') return t('nationalTeams.topScorersSourceTheSportsDb');
  return '';
});
</script>

<style scoped>
.top-scorers-podium .card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.top-scorers-source {
  font-size: 0.82rem;
}

.top-scorers-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.top-scorers-item {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
}

.top-scorers-item--1 {
  border-color: color-mix(in srgb, var(--color-warning) 55%, var(--color-border));
}

.top-scorers-rank {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  background: var(--color-border);
}

.top-scorers-item--1 .top-scorers-rank {
  background: color-mix(in srgb, var(--color-warning) 35%, var(--color-surface));
}

.top-scorers-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.top-scorers-goals {
  font-weight: 700;
  white-space: nowrap;
}

.standing-team {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.standing-crest {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.player-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
