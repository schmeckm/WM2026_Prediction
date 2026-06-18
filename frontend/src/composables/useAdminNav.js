import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export function useAdminNavSections() {
  const { t } = useI18n();

  return computed(() => [
    {
      label: t('nav.adminSectionOverview'),
      links: [
        { to: '/admin', label: t('nav.adminDashboard'), icon: 'settings' },
      ],
    },
    {
      label: t('nav.adminSectionTournament'),
      links: [
        { to: '/admin/matches', label: t('nav.matchAdmin'), icon: 'calendar' },
        { to: '/admin/results', label: t('nav.results'), icon: 'chart' },
        { to: '/admin/results-copilot', label: t('nav.resultsCopilot'), icon: 'zap' },
        { to: '/admin/group-standings', label: t('nav.groupStandings'), icon: 'table' },
        { to: '/admin/sync', label: t('nav.sync'), icon: 'refresh' },
        { to: '/admin/import', label: t('nav.csvImport'), icon: 'download' },
        { to: '/admin/bonus-questions', label: t('nav.bonus'), icon: 'target' },
      ],
    },
    {
      label: t('nav.adminSectionScoring'),
      links: [
        { to: '/admin/scoring-rules', label: t('nav.scoringRules'), icon: 'award' },
        { to: '/admin/prizes', label: t('nav.prizesAdmin'), icon: 'trophy' },
        { to: '/admin/statistics', label: t('nav.statistics'), icon: 'chart' },
        { to: '/admin/predictions', label: t('nav.predictions'), icon: 'clipboard' },
        { to: '/admin/favorites', label: t('nav.favorites'), icon: 'star' },
        { to: '/admin/team-performance', label: t('nav.teamPerformance'), icon: 'users' },
      ],
    },
    {
      label: t('nav.adminSectionUsers'),
      links: [
        { to: '/admin/users', label: t('nav.users'), icon: 'users' },
        { to: '/admin/teams', label: t('nav.teams'), icon: 'building' },
        { to: '/admin/player-images', label: t('nav.playerImages'), icon: 'image' },
        { to: '/admin/email', label: t('nav.email'), icon: 'mail' },
        { to: '/admin/notifications', label: t('nav.notifications'), icon: 'bell' },
        { to: '/admin/feedback', label: t('nav.userFeedback'), icon: 'file-text' },
      ],
    },
    {
      label: t('nav.adminSectionSystem'),
      links: [
        { to: '/admin/ai-assistant', label: t('nav.aiAssistant'), icon: 'bot' },
        { to: '/admin/system', label: t('nav.systemStatus'), icon: 'activity' },
        { to: '/admin/backup', label: t('nav.dataBackup'), icon: 'backup' },
        { to: '/admin/audit-log', label: t('nav.auditLog'), icon: 'file-text' },
        { to: '/admin/api-docs', label: t('nav.apiDocs'), icon: 'file-text' },
      ],
    },
  ]);
}

export function useAdminNavLinks() {
  const sections = useAdminNavSections();

  return computed(() => sections.value.flatMap((section) => section.links));
}

export function useAdminBottomNavLinks() {
  const { t } = useI18n();

  return computed(() => [
    { to: '/admin', label: t('nav.adminDashboard'), icon: 'settings' },
    { to: '/admin/matches', label: t('nav.matchAdmin'), icon: 'calendar' },
    { to: '/admin/users', label: t('nav.users'), icon: 'users' },
  ]);
}
