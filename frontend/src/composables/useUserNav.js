import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '../stores/appSettingsStore';

export function useUserNavLinks() {
  const { t } = useI18n();
  const appSettings = useAppSettingsStore();

  return computed(() => {
    const primaryLinks = [
      { to: '/dashboard', label: t('nav.dashboard'), icon: 'home' },
      { to: '/tip-copilot', label: t('nav.tipCopilot'), icon: 'zap' },
      { to: '/matches', label: t('nav.matches'), icon: 'matches' },
      { to: '/my-predictions', label: t('nav.myPredictions'), icon: 'edit' },
      { to: '/leaderboard', label: t('nav.leaderboard'), icon: 'trophy' },
      { to: '/team-ranking', label: t('nav.teamRanking'), icon: 'users' },
      { to: '/team-performance', label: t('nav.teamPerformance'), icon: 'users' },
      { to: '/ai-coach', label: t('nav.aiCoach'), icon: 'bot' },
    ];

    const tournamentLinks = [
      { to: '/group-standings', label: t('nav.groupStandings'), icon: 'table' },
      { to: '/tournament-bracket', label: t('nav.tournamentBracket'), icon: 'bracket' },
      { to: '/national-teams', label: t('nav.nationalTeams'), icon: 'globe' },
      { to: '/bonus', label: t('nav.bonus'), icon: 'target' },
    ];

    if (appSettings.showPrizesNav) {
      tournamentLinks.push({ to: '/prizes', label: t('nav.prizes'), icon: 'award' });
    }

    tournamentLinks.push(
      { to: '/favorites', label: t('nav.communityFavorites'), icon: 'star' },
      { to: '/statistics', label: t('nav.statistics'), icon: 'chart' },
      { to: '/help', label: t('help.nav'), icon: 'help' },
    );

    const accountLinks = [
      { to: '/notifications', label: t('nav.notifications'), icon: 'bell' },
      { to: '/feedback', label: t('nav.reportGap'), icon: 'file-text' },
      { to: '/profile', label: t('nav.profile'), icon: 'user' },
    ];

    return [
      { label: t('nav.sectionPrimary'), links: primaryLinks },
      { label: t('nav.sectionTournament'), links: tournamentLinks },
      { label: t('nav.sectionAccount'), links: accountLinks },
    ];
  });
}

export function useBottomNavLinks() {
  const { t } = useI18n();

  return computed(() => [
    { to: '/dashboard', label: t('nav.dashboard'), icon: 'home' },
    { to: '/matches', label: t('nav.matches'), icon: 'matches' },
    { to: '/leaderboard', label: t('nav.leaderboard'), icon: 'trophy' },
    { to: '/tip-copilot', label: t('nav.tipCopilot'), icon: 'zap' },
  ]);
}
