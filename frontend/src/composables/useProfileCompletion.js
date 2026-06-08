import { computed } from 'vue';
import { useAuthStore } from '../stores/authStore';

export function hasFavoriteTeam(user) {
  return !!(user?.favoriteNationalTeamId || user?.favoriteNationalTeamName);
}

export function hasTopScorerPick(user) {
  return !!(user?.topScorerPlayerId || user?.topScorerPlayerName);
}

export function isProfileWmComplete(user) {
  return hasFavoriteTeam(user) && hasTopScorerPick(user);
}

export function useProfileCompletion() {
  const authStore = useAuthStore();

  const missingFavoriteTeam = computed(() => (
    authStore.isAuthenticated && !hasFavoriteTeam(authStore.user)
  ));

  const missingTopScorer = computed(() => (
    authStore.isAuthenticated && !hasTopScorerPick(authStore.user)
  ));

  const needsCompletion = computed(() => (
    authStore.isAuthenticated && !isProfileWmComplete(authStore.user)
  ));

  return {
    missingFavoriteTeam,
    missingTopScorer,
    needsCompletion,
  };
}
