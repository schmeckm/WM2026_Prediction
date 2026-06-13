const { Op } = require('sequelize');
const { Match } = require('../models');
const { searchMatchHighlights } = require('./youtubeHighlightsService');

function parseIntOr(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

async function autoFillHighlightsForFinishedMatches(options = {}) {
  const lookbackHours = parseIntOr(options.lookbackHours, 72);
  const maxUpdates = parseIntOr(options.maxUpdates, 5);
  const maxResults = parseIntOr(options.maxResults, 6);

  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  const candidates = await Match.findAll({
    where: {
      status: 'finished',
      highlightsUrl: { [Op.is]: null },
      kickoffTime: { [Op.gte]: since.toISOString() },
    },
    order: [['kickoffTime', 'DESC']],
    limit: Math.max(0, maxUpdates),
  });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const match of candidates) {
    try {
      const result = await searchMatchHighlights(match.toJSON(), { maxResults });
      const best = Array.isArray(result?.items) ? result.items[0] : null;
      if (!best?.url) {
        skippedCount += 1;
        continue;
      }
      match.highlightsUrl = best.url;
      await match.save();
      updatedCount += 1;
    } catch (error) {
      console.warn(`[Highlights] Auto-fill failed for matchId=${match.id}: ${error?.message || 'unknown error'}`);
      skippedCount += 1;
    }
  }

  return {
    message: `updated=${updatedCount} scanned=${candidates.length} skipped=${skippedCount} lookbackHours=${lookbackHours}`,
    updatedCount,
    scannedCount: candidates.length,
    skippedCount,
    lookbackHours,
  };
}

module.exports = { autoFillHighlightsForFinishedMatches };

