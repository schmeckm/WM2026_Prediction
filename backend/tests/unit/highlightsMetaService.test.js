const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');
const {
  metaFromSearchItem,
  parseHighlightsMeta,
  serializeHighlightsMeta,
  attachHighlightsMeta,
} = require('../../services/highlightsMetaService');
const { buildCandidateWhere } = require('../../services/highlightsAutofillService');

describe('highlightsMetaService', () => {
  it('metaFromSearchItem normalizes search rows', () => {
    const meta = metaFromSearchItem({
      videoId: 'abc123',
      title: 'Brazil vs Switzerland Highlights',
      channelTitle: 'ESPN FC',
      viewCount: 120000,
      url: 'https://www.youtube.com/watch?v=abc123',
    });
    assert.equal(meta.videoId, 'abc123');
    assert.equal(meta.channelTitle, 'ESPN FC');
    assert.equal(meta.viewCount, 120000);
  });

  it('attachHighlightsMeta exposes parsed object and hides raw json', () => {
    const meta = metaFromSearchItem({
      videoId: 'abc123',
      title: 'Test',
      channelTitle: 'ESPN FC',
      url: 'https://www.youtube.com/watch?v=abc123',
    });
    const attached = attachHighlightsMeta({
      id: 1,
      highlightsUrl: meta.url,
      highlightsMetaJson: serializeHighlightsMeta(meta),
    });
    assert.equal(attached.highlightsMeta.title, 'Test');
    assert.equal(attached.highlightsMetaJson, undefined);
  });

  it('parseHighlightsMeta returns null for invalid json', () => {
    assert.equal(parseHighlightsMeta('{bad json'), null);
  });
});

describe('highlightsAutofillService buildCandidateWhere', () => {
  it('backfillAll removes kickoff lookback filter', () => {
    const where = buildCandidateWhere({ backfillAll: true });
    assert.equal(where.status, 'finished');
    assert.equal(where.highlightsUrl?.[Op.is], null);
    assert.equal(where.kickoffTime, undefined);
  });

  it('refreshMetadataOnly targets finished matches with url but no meta', () => {
    const where = buildCandidateWhere({ refreshMetadataOnly: true });
    assert.equal(where.status, 'finished');
    assert.ok(Array.isArray(where[Op.or]));
  });
});
