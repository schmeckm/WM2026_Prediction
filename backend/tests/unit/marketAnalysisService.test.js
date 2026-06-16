const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  analyzeMatch,
  buildMarketAnalysisCsv,
} = require('../../services/marketAnalysisService');

describe('marketAnalysisService', () => {
  const finishedMatch = {
    id: 1,
    matchNumber: 12,
    homeTeam: 'France',
    awayTeam: 'Senegal',
    groupName: 'A',
    stage: 'GROUP',
    kickoffTime: new Date('2026-06-16T19:00:00Z'),
    status: 'finished',
    homeScore: 2,
    awayScore: 0,
    marketOddsAtKickoffJson: JSON.stringify({
      bookmaker: 'Pinnacle',
      probabilities: { home: 52.3, draw: 24.1, away: 23.6 },
    }),
  };

  it('analyzes finished match with kickoff odds', () => {
    const result = analyzeMatch(finishedMatch);
    assert.equal(result.homeTeam, 'France');
    assert.equal(result.marketCorrect, true);
    assert.equal(result.marketFavorite.team, 'France');
    assert.equal(result.actualOutcome, 'home');
  });

  it('builds csv export with team and match rows', () => {
    const data = {
      teams: [{
        team: 'France',
        matchesFinished: 1,
        avgMarketWinPct: 52.3,
        actualWinPct: 100,
        goalsFor: 2,
        goalsAgainst: 0,
        timesMarketFavorite: 1,
        marketFavoriteAccuracyPct: 100,
      }],
      matches: [analyzeMatch(finishedMatch)],
      groupRanking: [{ groupName: 'A', correct: 1, total: 1, accuracyPct: 100 }],
    };
    const csv = buildMarketAnalysisCsv(data);
    assert.match(csv, /France/);
    assert.match(csv, /Group,Correct,Total,AccuracyPct/);
  });
});
