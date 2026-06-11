const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getDateStringInTimezone,
  PENDING_STATUSES,
} = require('../../services/resultsCopilotService');

describe('resultsCopilotService', () => {
  it('exports pending statuses used for result entry', () => {
    assert.deepEqual(PENDING_STATUSES, ['scheduled', 'live', 'halftime']);
  });

  it('formats dates in configured timezone', () => {
    const date = new Date('2026-06-15T22:00:00Z');
    const zurich = getDateStringInTimezone(date, 'Europe/Zurich');
    const utc = getDateStringInTimezone(date, 'UTC');
    assert.match(zurich, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(utc, /^\d{4}-\d{2}-\d{2}$/);
  });
});
