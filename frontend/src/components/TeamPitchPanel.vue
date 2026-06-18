<template>
  <div id="team-pitch" class="team-pitch card mb-2">
    <div class="card-header team-pitch__header">
      <div>
        <h3>⚽ {{ t('teamPitch.title') }}</h3>
        <p class="team-pitch__tagline text-muted">{{ t('teamPitch.tagline') }}</p>
      </div>
      <span class="badge badge-info team-pitch__beta">{{ t('teamPitch.beta') }}</span>
    </div>

    <div class="card-body">
      <div class="team-pitch__field" role="img" :aria-label="t('teamPitch.fieldAria')">
        <div class="team-pitch__center-line" aria-hidden="true" />
        <div class="team-pitch__center-circle" aria-hidden="true" />

        <p v-if="pitchPlayers.length === 0" class="team-pitch__empty text-muted">
          {{ t('teamPitch.emptyPitch') }}
        </p>
        <div v-else class="team-pitch__row team-pitch__row--pitch">
          <div
            v-for="player in pitchPlayers"
            :key="player.userId"
            class="team-pitch__slot"
            :class="{ 'team-pitch__slot--nudge': player.zone === 'nudge' }"
          >
            <div class="team-pitch__avatar-wrap">
              <UserAvatar
                :image-url="player.imageUrl"
                :avatar-color="player.avatarColor"
                :avatar-emoji="player.avatarEmoji"
                :first-name="player.firstName"
                :last-name="player.lastName"
                size="md"
              />
              <span v-if="player.zone === 'nudge'" class="team-pitch__badge team-pitch__badge--nudge" :title="t('teamPitch.nudgeTooltip')">
                ⚡
              </span>
            </div>
            <span class="team-pitch__name">{{ player.firstName }}</span>
            <span v-if="player.zone === 'nudge'" class="team-pitch__hint">{{ t('teamPitch.nudgeHint') }}</span>
          </div>
        </div>
      </div>

      <div class="team-pitch__bench">
        <div class="team-pitch__bench-label">
          <span class="team-pitch__bench-icon" aria-hidden="true">🪑</span>
          <span>{{ t('teamPitch.benchTitle') }}</span>
        </div>
        <p class="team-pitch__bench-sub text-muted">{{ t('teamPitch.benchSub') }}</p>

        <div v-if="benchPlayers.length === 0" class="team-pitch__bench-empty">
          {{ t('teamPitch.benchEmpty') }} 🎉
        </div>
        <div v-else class="team-pitch__row team-pitch__row--bench">
          <div
            v-for="player in benchPlayers"
            :key="player.userId"
            class="team-pitch__slot team-pitch__slot--bench"
          >
            <div class="team-pitch__avatar-wrap">
              <UserAvatar
                :image-url="player.imageUrl"
                :avatar-color="player.avatarColor"
                :avatar-emoji="player.avatarEmoji"
                :first-name="player.firstName"
                :last-name="player.lastName"
                size="md"
              />
              <span class="team-pitch__badge team-pitch__badge--bench">🍊</span>
            </div>
            <span class="team-pitch__name">{{ player.firstName }}</span>
            <span class="team-pitch__hint">{{ t('teamPitch.benchHint') }}</span>
          </div>
        </div>
      </div>

      <p class="team-pitch__footer text-muted">
        {{ t('teamPitch.footer') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UserAvatar from './UserAvatar.vue';

const props = defineProps({
  members: { type: Array, default: () => [] },
});

const { t } = useI18n();

const classified = computed(() => props.members.map((member) => {
  const tips = Number(member.submittedPredictions ?? 0);
  const completion = Number(member.completionPercentage ?? 0);

  let zone = 'pitch';
  if (tips === 0) {
    zone = 'bench';
  } else if (completion > 0 && completion < 30) {
    zone = 'nudge';
  }

  return {
    userId: member.userId,
    firstName: member.firstName,
    lastName: member.lastName,
    imageUrl: member.imageUrl,
    avatarColor: member.avatarColor,
    avatarEmoji: member.avatarEmoji,
    zone,
  };
}));

const pitchPlayers = computed(() => classified.value.filter((p) => p.zone !== 'bench'));
const benchPlayers = computed(() => classified.value.filter((p) => p.zone === 'bench'));
</script>

<style scoped>
.mb-2 { margin-bottom: 1.5rem; }

.team-pitch__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.team-pitch__header h3 {
  margin: 0 0 0.25rem;
}

.team-pitch__tagline {
  margin: 0;
  font-size: 0.85rem;
  max-width: 36rem;
}

.team-pitch__beta {
  flex-shrink: 0;
  font-size: 0.7rem;
}

.team-pitch__field {
  position: relative;
  border-radius: 16px;
  padding: 1.25rem 1rem 1.5rem;
  margin-bottom: 1rem;
  background:
    radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 70%),
    linear-gradient(165deg, #2d6a4f 0%, #40916c 45%, #52b788 100%);
  box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.team-pitch__center-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(-50%);
}

.team-pitch__center-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 72px;
  height: 72px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.team-pitch__empty {
  text-align: center;
  margin: 1rem 0;
  font-size: 0.9rem;
}

.team-pitch__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem 1.25rem;
  position: relative;
  z-index: 1;
}

.team-pitch__slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  max-width: 5.5rem;
  text-align: center;
}

.team-pitch__slot--nudge .team-pitch__avatar-wrap {
  animation: gentle-pulse 2.5s ease-in-out infinite;
}

@keyframes gentle-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

.team-pitch__avatar-wrap {
  position: relative;
  border-radius: 50%;
  padding: 3px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.team-pitch__slot--bench .team-pitch__avatar-wrap {
  background: rgba(255, 255, 255, 0.45);
  opacity: 0.88;
  filter: grayscale(0.15);
}

.team-pitch__badge {
  position: absolute;
  bottom: -2px;
  right: -4px;
  font-size: 0.95rem;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.team-pitch__badge--nudge {
  font-size: 0.85rem;
}

.team-pitch__name {
  font-size: 0.78rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  word-break: break-word;
}

.team-pitch__slot--bench .team-pitch__name {
  color: var(--color-text);
  text-shadow: none;
}

.team-pitch__hint {
  font-size: 0.65rem;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.88);
  max-width: 5.5rem;
}

.team-pitch__slot--bench .team-pitch__hint {
  color: var(--color-text-muted);
}

.team-pitch__bench {
  background: linear-gradient(180deg, #f5e6d3 0%, #edd9c4 100%);
  border-radius: 12px;
  padding: 1rem 1rem 1.15rem;
  border: 2px dashed rgba(180, 120, 60, 0.35);
}

.team-pitch__bench-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.team-pitch__bench-sub {
  font-size: 0.8rem;
  margin: 0 0 0.85rem;
}

.team-pitch__bench-empty {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  padding: 0.5rem 0;
}

.team-pitch__footer {
  margin: 1rem 0 0;
  font-size: 0.78rem;
  text-align: center;
}

@media (max-width: 480px) {
  .team-pitch__row--bench {
    flex-wrap: nowrap;
    overflow-x: auto;
    justify-content: flex-start;
    padding-bottom: 0.35rem;
    -webkit-overflow-scrolling: touch;
  }

  .team-pitch__slot {
    flex-shrink: 0;
  }
}
</style>
