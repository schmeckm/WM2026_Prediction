const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  shouldRunAutoResultSync,
  markAutoResultSyncCompleted,
  resetAutoResultSyncStateForTests,
  AUTO_RESULT_SYNC_MIN_INTERVAL_MS,
} = require('../../services/schedulerMatchSyncHelpers');

describe('schedulerMatchSyncHelpers', () => {
  beforeEach(() => {
    resetAutoResultSyncStateForTests();
  });

  it('shouldRunAutoResultSync allows first run immediately', () => {
    assert.equal(shouldRunAutoResultSync(1000), true);
  });

  it('shouldRunAutoResultSync respects minimum interval', () => {
    markAutoResultSyncCompleted(10_000);
    assert.equal(shouldRunAutoResultSync(10_000 + AUTO_RESULT_SYNC_MIN_INTERVAL_MS - 1), false);
    assert.equal(shouldRunAutoResultSync(10_000 + AUTO_RESULT_SYNC_MIN_INTERVAL_MS), true);
  });
});
