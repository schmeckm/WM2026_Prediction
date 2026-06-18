<template>
  <div id="team-pitch" class="team-pitch card mb-2">
    <div class="card-header team-pitch__header">
      <div>
        <h3>⚽ {{ t(titleKey) }}</h3>
        <p class="team-pitch__tagline text-muted">{{ t(taglineKey) }}</p>
      </div>
      <span class="badge badge-info team-pitch__beta">{{ t('teamPitch.beta') }}</span>
    </div>

    <div class="card-body">
      <div class="team-pitch__scene">
        <div class="team-pitch__field" :aria-label="t('teamPitch.fieldAria')">
          <div class="team-pitch__center-line" aria-hidden="true" />
          <div class="team-pitch__center-circle" aria-hidden="true" />
          <div class="team-pitch__penalty-arc team-pitch__penalty-arc--left" aria-hidden="true" />
          <div class="team-pitch__penalty-arc team-pitch__penalty-arc--right" aria-hidden="true" />

          <p v-if="pitchPlayers.length === 0" class="team-pitch__empty">
            {{ t('teamPitch.emptyPitch') }}
          </p>
          <div v-else class="team-pitch__row team-pitch__row--pitch">
            <div
              v-for="player in pitchPlayers"
              :key="player.userId"
              class="team-pitch__slot"
              :class="{ 'team-pitch__slot--yellow': player.zone === 'yellow' }"
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
                <span
                  v-if="player.zone === 'yellow'"
                  class="team-pitch__card team-pitch__card--yellow"
                  :title="t('teamPitch.yellowTooltip')"
                  aria-hidden="true"
                />
              </div>
              <span class="team-pitch__name">{{ player.firstName }}</span>
              <span v-if="showTeamName && player.teamName" class="team-pitch__team">{{ player.teamName }}</span>
              <span v-if="player.zone === 'yellow'" class="team-pitch__hint">{{ t('teamPitch.yellowHint') }}</span>
            </div>
          </div>
        </div>

        <div class="team-pitch__sideline">
          <div class="team-pitch__sideline-head">
            <TeamPitchReferee class="team-pitch__referee" />
            <div class="team-pitch__sideline-copy">
              <div class="team-pitch__sideline-label">
                <span class="team-pitch__card team-pitch__card--red team-pitch__card--label" aria-hidden="true" />
                <span>{{ t('teamPitch.redTitle') }}</span>
              </div>
              <p class="team-pitch__sideline-sub text-muted">{{ t('teamPitch.redSub') }}</p>
            </div>
          </div>

          <div v-if="redPlayers.length === 0" class="team-pitch__sideline-empty">
            {{ t('teamPitch.redEmpty') }} 🎉
          </div>
          <div v-else class="team-pitch__row team-pitch__row--sideline">
            <div
              v-for="player in redPlayers"
              :key="player.userId"
              class="team-pitch__slot team-pitch__slot--red"
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
                <span class="team-pitch__card team-pitch__card--red" aria-hidden="true" />
              </div>
              <span class="team-pitch__name">{{ player.firstName }}</span>
              <span v-if="showTeamName && player.teamName" class="team-pitch__team">{{ player.teamName }}</span>
              <span class="team-pitch__hint">{{ t('teamPitch.redHint') }}</span>
            </div>
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
import TeamPitchReferee from './TeamPitchReferee.vue';
import { classifyTeamPitchMember } from '../composables/useTeamPitchZones';

const props = defineProps({
  members: { type: Array, default: () => [] },
  showTeamName: { type: Boolean, default: false },
  titleKey: { type: String, default: 'teamPitch.title' },
  taglineKey: { type: String, default: 'teamPitch.tagline' },
});

const { t } = useI18n();

const classified = computed(() => props.members.map((member) => ({
  userId: member.userId,
  firstName: member.firstName,
  lastName: member.lastName,
  teamName: member.teamName || null,
  imageUrl: member.imageUrl,
  avatarColor: member.avatarColor,
  avatarEmoji: member.avatarEmoji,
  zone: classifyTeamPitchMember(member),
})));

const pitchPlayers = computed(() => classified.value.filter((p) => p.zone !== 'red'));
const redPlayers = computed(() => classified.value.filter((p) => p.zone === 'red'));
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

.team-pitch__scene {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.team-pitch__field {
  position: relative;
  border-radius: 16px;
  padding: 1.25rem 1rem 1.5rem;
  background:
    radial-gradient(ellipse 70% 45% at 50% 40%, rgba(0, 255, 127, 0.14) 0%, transparent 65%),
    radial-gradient(ellipse 90% 60% at 50% 100%, rgba(0, 0, 0, 0.35) 0%, transparent 55%),
    linear-gradient(168deg, #163328 0%, #1f4a3a 42%, #255a47 100%);
  border: 1px solid rgba(0, 255, 127, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -8px 24px rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

.team-pitch__center-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: rgba(255, 255, 255, 0.16);
  transform: translateX(-50%);
}

.team-pitch__center-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 72px;
  height: 72px;
  border: 2px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.team-pitch__penalty-arc {
  position: absolute;
  top: 50%;
  width: 56px;
  height: 56px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translateY(-50%);
}

.team-pitch__penalty-arc--left {
  left: -28px;
}

.team-pitch__penalty-arc--right {
  right: -28px;
}

.team-pitch__empty {
  text-align: center;
  margin: 1rem 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.82);
  position: relative;
  z-index: 1;
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

.team-pitch__slot--yellow .team-pitch__avatar-wrap {
  box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.9);
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

.team-pitch__slot--red .team-pitch__avatar-wrap {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  opacity: 0.95;
  filter: none;
}

.team-pitch__card {
  position: absolute;
  bottom: -2px;
  right: -6px;
  width: 11px;
  height: 14px;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}

.team-pitch__card--yellow {
  background: linear-gradient(180deg, #fde047 0%, #eab308 100%);
}

.team-pitch__card--red {
  background: linear-gradient(180deg, #f87171 0%, #dc2626 100%);
}

.team-pitch__card--label {
  position: static;
  flex-shrink: 0;
  width: 13px;
  height: 17px;
}

.team-pitch__name {
  font-size: 0.78rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  word-break: break-word;
}

.team-pitch__team {
  font-size: 0.62rem;
  font-weight: 500;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.78);
  max-width: 5.5rem;
  word-break: break-word;
}

.team-pitch__slot--red .team-pitch__team {
  color: var(--color-text-muted);
}

.team-pitch__slot--red .team-pitch__name {
  color: var(--color-text);
  text-shadow: none;
}

.team-pitch__hint {
  font-size: 0.65rem;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.88);
  max-width: 5.5rem;
}

.team-pitch__slot--yellow .team-pitch__hint {
  color: #fde047;
}

.team-pitch__slot--red .team-pitch__hint {
  color: var(--color-text-muted);
}

.team-pitch__sideline {
  background:
    linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, transparent 55%),
    var(--color-surface-elevated);
  border-radius: 12px;
  padding: 0.85rem 1rem 1.15rem;
  border: 1px dashed rgba(239, 68, 68, 0.4);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.team-pitch__sideline-head {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.team-pitch__referee {
  margin-bottom: -0.15rem;
  align-self: flex-end;
}

.team-pitch__sideline-copy {
  flex: 1;
  min-width: 0;
  align-self: center;
}

.team-pitch__sideline-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
  color: var(--color-text);
}

.team-pitch__sideline-sub {
  font-size: 0.8rem;
  margin: 0;
}

.team-pitch__sideline-empty {
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
  .team-pitch__row--sideline {
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
