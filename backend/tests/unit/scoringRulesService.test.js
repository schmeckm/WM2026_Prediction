const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveKnockoutTier,
  resolveEffectiveScoringRules,
  buildDefaultKnockoutStagePoints,
} = require('../../services/scoringRulesService');
const { calculatePoints } = require('../../services/pointsCalculationService');

const baseRules = {
  exactResultPoints: 4,
  goalDifferencePoints: 3,
  tendencyPoints: 2,
  wrongPredictionPoints: 0,
};

const knockoutRules = {
  ...baseRules,
  knockoutStagePointsEnabled: true,
  knockoutStagePoints: buildDefaultKnockoutStagePoints(baseRules),
};

describe('scoringRulesService', () => {
  test('maps readable knockout stage labels to tiers', () => {
    assert.equal(resolveKnockoutTier('Quarter-finals'), 'QUARTER_FINALS');
    assert.equal(resolveKnockoutTier('Semi-finals'), 'SEMI_FINALS');
    assert.equal(resolveKnockoutTier('FINAL'), 'FINAL');
    assert.equal(resolveKnockoutTier('Group Stage'), null);
  });

  test('uses higher final points when knockout scoring is enabled', () => {
    const effective = resolveEffectiveScoringRules(knockoutRules, 'Final');
    assert.equal(effective.exactResultPoints, 10);

    const prediction = { predictedHomeScore: 2, predictedAwayScore: 1 };
    const match = { homeScore: 2, awayScore: 1, status: 'finished', stage: 'Final' };
    assert.equal(calculatePoints(prediction, match, knockoutRules), 10);
  });

  test('keeps base points for group matches', () => {
    const effective = resolveEffectiveScoringRules(knockoutRules, 'Group A');
    assert.equal(effective.exactResultPoints, 4);
  });

  test('ignores knockout overrides when feature is disabled', () => {
    const disabledRules = { ...knockoutRules, knockoutStagePointsEnabled: false };
    const effective = resolveEffectiveScoringRules(disabledRules, 'Final');
    assert.equal(effective.exactResultPoints, 4);
  });
});
