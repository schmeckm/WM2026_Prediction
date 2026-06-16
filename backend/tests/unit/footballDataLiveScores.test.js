const { test, describe, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const footballDataProvider = require('../../services/providers/footballDataProvider');

const baseConfig = {
  apiKey: 'test-key',
  baseUrl: 'https://api.football-data.org/v4',
  competitionCode: 'WC',
  competitionNumericId: '2000',
  season: '2026',
};

function jsonResponse(body, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      get: (name) => headers[name.toLowerCase()] || null,
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe('footballDataProvider live score fetch', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('returns empty list when one status fails but others succeed', async () => {
    const originalFetch = global.fetch;
    let call = 0;
    global.fetch = async () => {
      call += 1;
      if (call === 1) {
        return jsonResponse({ message: 'bad status' }, 400);
      }
      return jsonResponse({ matches: [] });
    };

    try {
      const result = await footballDataProvider.fetchForSync(baseConfig, 'live_scores');
      assert.equal(result.fixtures.length, 0);
      assert.equal(call, 3);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('throws when every status request fails', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => jsonResponse({ message: 'forbidden' }, 403);

    try {
      await assert.rejects(
        () => footballDataProvider.fetchForSync(baseConfig, 'live_scores'),
        (error) => error.status === 403,
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});
