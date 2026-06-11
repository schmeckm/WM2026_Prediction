const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildDeterministicInsights } = require('../../services/aiDashboardInsightsService');

const sampleContext = {
  missingTodayCount: 0,
  missingPredictionsCount: 17,
  exactResults: 2,
  rank: 5,
  teamName: 'Team TROIKA',
  teamRanking: { rank: 9 },
};

describe('aiDashboardInsightsService.buildDeterministicInsights', () => {
  test('uses English copy for en locale', () => {
    const insights = buildDeterministicInsights(sampleContext, 'en');
    assert.ok(insights.some((item) => item.text.includes('17 predictions missing in total')));
    assert.ok(insights.some((item) => item.text.includes('Team TROIKA')));
    assert.ok(insights.some((item) => item.text.includes('rank 9')));
  });

  test('uses German copy for de locale', () => {
    const insights = buildDeterministicInsights(sampleContext, 'de');
    assert.ok(insights.some((item) => item.text.includes('17 Tipps')));
    assert.ok(insights.some((item) => item.text.includes('Teamwertung')));
  });
});
