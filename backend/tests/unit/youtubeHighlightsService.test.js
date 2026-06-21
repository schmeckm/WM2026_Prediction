const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildQuery,
  isPreferredChannel,
  rankHighlightResults,
  mergeHighlightResults,
  getPreferredChannelIds,
  getRelevanceLanguage,
  DEFAULT_PREFERRED_CHANNEL_IDS,
  DEFAULT_RELEVANCE_LANGUAGE,
} = require('../../services/youtubeHighlightsService');

describe('youtubeHighlightsService', () => {
  const originalPreferredIds = process.env.YOUTUBE_PREFERRED_CHANNEL_IDS;
  const originalPreferredKeywords = process.env.YOUTUBE_PREFERRED_CHANNEL_KEYWORDS;
  const originalRelevanceLanguage = process.env.YOUTUBE_RELEVANCE_LANGUAGE;

  afterEach(() => {
    if (originalPreferredIds === undefined) delete process.env.YOUTUBE_PREFERRED_CHANNEL_IDS;
    else process.env.YOUTUBE_PREFERRED_CHANNEL_IDS = originalPreferredIds;
    if (originalPreferredKeywords === undefined) delete process.env.YOUTUBE_PREFERRED_CHANNEL_KEYWORDS;
    else process.env.YOUTUBE_PREFERRED_CHANNEL_KEYWORDS = originalPreferredKeywords;
    if (originalRelevanceLanguage === undefined) delete process.env.YOUTUBE_RELEVANCE_LANGUAGE;
    else process.env.YOUTUBE_RELEVANCE_LANGUAGE = originalRelevanceLanguage;
  });

  it('buildQuery includes teams, year and highlights', () => {
    const query = buildQuery({
      homeTeam: 'Switzerland',
      awayTeam: 'Brazil',
      kickoffTime: '2026-06-15T18:00:00.000Z',
    });
    assert.equal(query, 'Switzerland Brazil 2026 highlights');
  });

  it('defaults preferred channels to English broadcasters', () => {
    delete process.env.YOUTUBE_PREFERRED_CHANNEL_IDS;
    assert.deepEqual(getPreferredChannelIds(), DEFAULT_PREFERRED_CHANNEL_IDS);
  });

  it('defaults relevance language to English', () => {
    delete process.env.YOUTUBE_RELEVANCE_LANGUAGE;
    assert.equal(getRelevanceLanguage(), DEFAULT_RELEVANCE_LANGUAGE);
  });

  it('isPreferredChannel matches ESPN FC by channel id and title', () => {
    assert.equal(isPreferredChannel({
      channelId: DEFAULT_PREFERRED_CHANNEL_IDS[0],
      channelTitle: 'Anything',
    }), true);
    assert.equal(isPreferredChannel({
      channelId: 'other',
      channelTitle: 'ESPN FC',
    }), true);
    assert.equal(isPreferredChannel({
      channelId: 'other',
      channelTitle: 'Random Highlights Channel',
    }), false);
  });

  it('rankHighlightResults puts preferred channels first', () => {
    const ranked = rankHighlightResults([
      { videoId: 'a', channelTitle: 'Other Channel', viewCount: 99999 },
      { videoId: 'b', channelId: DEFAULT_PREFERRED_CHANNEL_IDS[0], channelTitle: 'ESPN FC', viewCount: 100 },
      { videoId: 'c', channelTitle: 'Another Channel', viewCount: 50000 },
    ]);
    assert.equal(ranked[0].videoId, 'b');
    assert.deepEqual(ranked.slice(1).map((row) => row.videoId), ['a', 'c']);
  });

  it('rankHighlightResults sorts by view count within each tier', () => {
    const ranked = rankHighlightResults([
      { videoId: 'pref-low', channelId: DEFAULT_PREFERRED_CHANNEL_IDS[0], viewCount: 1000 },
      { videoId: 'pref-high', channelId: DEFAULT_PREFERRED_CHANNEL_IDS[0], viewCount: 50000 },
      { videoId: 'other-low', channelTitle: 'Other', viewCount: 2000 },
      { videoId: 'other-high', channelTitle: 'Other 2', viewCount: 80000 },
    ]);
    assert.deepEqual(ranked.map((row) => row.videoId), ['pref-high', 'pref-low', 'other-high', 'other-low']);
  });

  it('mergeHighlightResults deduplicates and preserves preferred-first order', () => {
    const merged = mergeHighlightResults([
      [{ videoId: 'espn', channelTitle: 'ESPN FC' }],
      [
        { videoId: 'other', channelTitle: 'Other' },
        { videoId: 'espn', channelTitle: 'ESPN FC duplicate' },
      ],
    ], { limit: 3 });
    assert.deepEqual(merged.map((row) => row.videoId), ['espn', 'other']);
  });

  it('allows disabling preferred channels via empty env', () => {
    process.env.YOUTUBE_PREFERRED_CHANNEL_IDS = '';
    assert.deepEqual(getPreferredChannelIds(), []);
  });
});
