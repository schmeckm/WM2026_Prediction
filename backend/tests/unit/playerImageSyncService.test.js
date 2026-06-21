const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  shouldSkipCachedRecord,
  buildSyncResultMessage,
} = require('../../services/playerImageSyncService');

describe('playerImageSyncService', () => {
  it('shouldSkipCachedRecord skips fresh records with image', () => {
    const record = {
      imageUrl: 'https://example.com/a.jpg',
      lastCheckedAt: new Date(),
    };
    assert.equal(shouldSkipCachedRecord(record, false), true);
  });

  it('shouldSkipCachedRecord skips fresh negative cache', () => {
    const record = {
      imageUrl: null,
      lastCheckedAt: new Date(),
    };
    assert.equal(shouldSkipCachedRecord(record, false), true);
  });

  it('shouldSkipCachedRecord does not skip when forceRefresh is true', () => {
    const record = {
      imageUrl: 'https://example.com/a.jpg',
      lastCheckedAt: new Date(),
    };
    assert.equal(shouldSkipCachedRecord(record, true), false);
  });

  it('buildSyncResultMessage includes cache count', () => {
    const message = buildSyncResultMessage({
      createdCount: 2,
      updatedCount: 1,
      cachedCount: 900,
      skippedCount: 50,
      errorCount: 0,
    });
    assert.match(message, /2 neu/);
    assert.match(message, /900 aus Cache/);
  });
});
