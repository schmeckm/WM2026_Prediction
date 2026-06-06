import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const ROUTE_TITLE_KEYS = {
  Dashboard: 'nav.dashboard',
  Matches: 'nav.matches',
  NationalTeams: 'nav.nationalTeams',
  MyPredictions: 'nav.myPredictions',
  Leaderboard: 'nav.leaderboard',
  TeamRanking: 'nav.teamRanking',
  Profile: 'nav.profile',
  Statistics: 'nav.statistics',
  Bonus: 'nav.bonus',
  Notifications: 'nav.notifications',
  AICoach: 'nav.aiCoach',
  Help: 'help.nav',
  AdminDashboard: 'nav.adminDashboard',
  AdminUsers: 'nav.users',
  AdminTeams: 'nav.teams',
  AdminPlayerImages: 'nav.playerImages',
  AdminMatches: 'nav.matchAdmin',
  AdminResults: 'nav.results',
  AdminPredictions: 'nav.predictions',
  AdminFavorites: 'nav.favorites',
  AdminScoringRules: 'nav.scoringRules',
  AdminImport: 'nav.csvImport',
  AdminSync: 'nav.sync',
  AdminBonus: 'nav.bonus',
  AdminEmail: 'nav.email',
  AdminStatistics: 'nav.statistics',
  AdminNotifications: 'nav.notifications',
  AdminAuditLog: 'nav.auditLog',
  AdminBackup: 'nav.dataBackup',
  AdminSystem: 'nav.systemStatus',
  AdminAIAssistant: 'nav.aiAssistant',
};

export function usePageBreadcrumb(adminMode = false) {
  const route = useRoute();
  const { t } = useI18n();

  const crumbs = computed(() => {
    const titleKey = ROUTE_TITLE_KEYS[route.name];
    const pageTitle = titleKey ? t(titleKey) : '';
    if (!pageTitle) return [];

    if (adminMode) {
      return [
        { label: t('nav.administration'), to: '/admin' },
        { label: pageTitle },
      ];
    }

    return [{ label: pageTitle }];
  });

  return { crumbs };
}
