<template>
  <div v-if="showBanner" class="profile-completion-banner">
    <div class="banner-content">
      <strong>{{ t('profile.completionBannerTitle') }}</strong>
      <p>{{ bannerMessage }}</p>
    </div>
    <router-link to="/profile" class="btn btn-accent btn-sm">
      {{ t('profile.completionGoToProfile') }}
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useProfileCompletion } from '../composables/useProfileCompletion';

const { t } = useI18n();
const route = useRoute();
const { missingFavoriteTeam, missingTopScorer, needsCompletion } = useProfileCompletion();

const showBanner = computed(() => needsCompletion.value && route.name !== 'Profile');

const bannerMessage = computed(() => {
  if (missingFavoriteTeam.value && missingTopScorer.value) {
    return t('profile.completionBannerBoth');
  }
  if (missingFavoriteTeam.value) {
    return t('profile.completionBannerTeam');
  }
  return t('profile.completionBannerScorer');
});
</script>

<style scoped>
.profile-completion-banner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem 1.25rem;
  border-radius: var(--radius);
  border: 1px solid rgba(255, 193, 7, 0.35);
  background: rgba(255, 193, 7, 0.08);
  box-shadow: var(--shadow-sm);
}

.banner-content p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
