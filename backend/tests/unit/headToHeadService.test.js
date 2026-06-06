const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { computeSummary, mapAggregatesToSummary } = require('../../services/headToHeadService');

describe('headToHeadService.computeSummary', () => {
  test('counts wins from team A home and away perspective', () => {
    const meetings = [
      {
        homeTeam: 'Germany',
        awayTeam: 'France',
        homeScore: 2,
        awayScore: 1,
        winner: 'home',
      },
      {
        homeTeam: 'France',
        awayTeam: 'Germany',
        homeScore: 0,
        awayScore: 0,
        winner: 'draw',
      },
      {
        homeTeam: 'France',
        awayTeam: 'Germany',
        homeScore: 1,
        awayScore: 0,
        winner: 'home',
      },
    ];

    const summary = computeSummary(meetings, 'Germany', 'France');
    assert.deepEqual(summary, {
      totalMatches: 3,
      totalGoals: 4,
      teamAWins: 1,
      teamBWins: 1,
      draws: 1,
    });
  });
});

describe('headToHeadService.mapAggregatesToSummary', () => {
  test('maps aggregate wins relative to reference home team', () => {
    const summary = mapAggregatesToSummary(
      {
        numberOfMatches: 3,
        totalGoals: 5,
        homeTeam: { name: 'Mexico', wins: 2, draws: 0, losses: 1 },
        awayTeam: { name: 'South Africa', wins: 1, draws: 0, losses: 2 },
      },
      'Mexico',
      'South Africa',
      'Mexico',
      'South Africa',
    );
    assert.deepEqual(summary, {
      totalMatches: 3,
      totalGoals: 5,
      teamAWins: 2,
      teamBWins: 1,
      draws: 0,
    });
  });
});
