const { buildUserContext } = require('./aiContextBuilderService');
const { generateText, getSystemPrompt, checkAiAvailability } = require('./llmService');
const { t, normalizeLocale } = require('./i18nService');

function buildDeterministicInsights(context, locale) {
  const insights = [];

  if (context.missingTodayCount > 0) {
    const key = context.missingTodayCount > 1
      ? 'ai.dashboardInsights.missingTodayMany'
      : 'ai.dashboardInsights.missingTodayOne';
    insights.push({
      type: 'warning',
      icon: '⚠️',
      text: t(key, locale, { count: context.missingTodayCount }),
      action: '/matches?filter=missing',
    });
  }

  if (context.missingPredictionsCount > 0 && context.missingTodayCount === 0) {
    insights.push({
      type: 'info',
      icon: '📝',
      text: t('ai.dashboardInsights.missingTotal', locale, { count: context.missingPredictionsCount }),
      action: '/matches?filter=missing',
    });
  }

  if (context.exactResults > 0) {
    const key = context.exactResults > 1
      ? 'ai.dashboardInsights.exactMany'
      : 'ai.dashboardInsights.exactOne';
    insights.push({
      type: 'success',
      icon: '🎯',
      text: t(key, locale, { count: context.exactResults }),
      action: '/my-predictions',
    });
  }

  if (context.rank && context.rank > 1) {
    insights.push({
      type: 'info',
      icon: '🏆',
      text: t('ai.dashboardInsights.rankCatchUp', locale, { rank: context.rank }),
      action: '/leaderboard',
    });
  }

  if (context.teamRanking && context.teamRanking.rank > 1) {
    insights.push({
      type: 'info',
      icon: '👥',
      text: t('ai.dashboardInsights.teamRanking', locale, {
        teamName: context.teamName,
        rank: context.teamRanking.rank,
      }),
      action: '/team-ranking',
    });
  }

  return insights;
}

async function getDashboardInsights(userId, locale = 'de') {
  const language = normalizeLocale(locale);
  const context = await buildUserContext(userId);
  if (!context) return { insights: [], aiEnabled: false };

  const deterministic = buildDeterministicInsights(context, language);

  let aiInsight = null;
  const aiCheck = checkAiAvailability('user_coach', language);

  if (aiCheck.available && deterministic.length > 0) {
    try {
      const systemPrompt = getSystemPrompt('user_coach', language);
      const userPrompt = t('ai.dashboardInsights.aiPrompt', language);
      const { text } = await generateText({
        systemPrompt,
        userPrompt,
        context,
        maxTokens: 100,
        locale: language,
      });
      aiInsight = { type: 'ai', icon: '🤖', text, action: '/ai-coach' };
    } catch {
      // AI optional for insights
    }
  }

  const insights = aiInsight ? [aiInsight, ...deterministic.slice(0, 2)] : deterministic.slice(0, 3);

  return { insights, aiEnabled: aiCheck.available };
}

module.exports = { getDashboardInsights, buildDeterministicInsights };
