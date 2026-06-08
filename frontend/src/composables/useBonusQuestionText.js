import { useI18n } from 'vue-i18n';

export function useBonusQuestionText() {
  const { t, te } = useI18n();

  function bonusQuestionText(question, { team } = {}) {
    if (!question) return '';

    if (
      question.resolutionKey === 'team_progress'
      || question.questionType === 'favorite_team_progress'
    ) {
      if (team) return t('bonus.favoriteTeamProgressQuestion', { team });
      return t('bonus.favoriteTeamProgressFallback');
    }

    if (question.resolutionKey) {
      const key = `bonus.defaultQuestions.${question.resolutionKey}`;
      if (te(key)) return t(key);
    }

    return question.questionText || '';
  }

  return { bonusQuestionText };
}
