const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildQuery,
  isPreferredChannel,
  rankHighlightResults,
  mergeHighlightResults,
  getPreferredChannelIds,
  getRelevanceLanguage,
  getSkipChannelKeywords,
  getRegionCode,
  shouldSkipVideo,
  isHighlightUsable,
  isBlockedInRegion,
  DEFAULT_PREFERRED_CHANNEL_IDS,
  DEFAULT_SKIP_CHANNEL_KEYWORDS,
  DEFAULT_REGION_CODE,
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

  it('skips Fox Soccer and other US-only channels by default', () => {
    delete process.env.YOUTUBE_SKIP_CHANNEL_KEYWORDS;
    assert.ok(getSkipChannelKeywords().includes('fox soccer'));
    assert.equal(shouldSkipVideo({ channelTitle: 'FOX Soccer' }), true);
    assert.equal(isHighlightUsable({ channelTitle: 'ESPN FC', blockedInRegion: false }), true);
    assert.equal(isHighlightUsable({ channelTitle: 'FOX Soccer', blockedInRegion: false }), false);
  });

  it('defaults region code to CH for geo filtering', () => {
    delete process.env.YOUTUBE_REGION_CODE;
    assert.equal(getRegionCode(), 'CH');
  });

  it('treats region-blocked videos as unusable', () => {
    assert.equal(isBlockedInRegion('CH', {
      contentDetails: { regionRestriction: { blocked: ['CH'] } },
    }), true);
    assert.equal(isHighlightUsable({
      channelTitle: 'ESPN FC',
      blockedInRegion: true,
    }), false);
  });

  it('omits publishedAfter for future kickoffs', () => {
    const { getPublishedAfterFilter } = require('../../services/youtubeHighlightsService');
    const now = new Date('2026-06-10T12:00:00.000Z');
    assert.equal(
      getPublishedAfterFilter('2026-06-15T18:00:00.000Z', 18, now),
      '',
    );
    const past = getPublishedAfterFilter('2026-06-09T20:00:00.000Z', 18, now);
    assert.ok(past.startsWith('2026-06-09'));
  });
});
