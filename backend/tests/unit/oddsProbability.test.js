const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateProbabilities } = require('../../utils/oddsProbability');

test('calculateProbabilities normalizes bookmaker margin', () => {
  const result = calculateProbabilities(2.0, 3.5, 4.0);

  assert.equal(result.home, 48.3);
  assert.equal(result.draw, 27.6);
  assert.equal(result.away, 24.1);
  assert.equal(+(result.home + result.draw + result.away).toFixed(1), 100);
});
