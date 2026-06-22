const { Op } = require('sequelize');
const { Match } = require('../models');
const { searchMatchHighlights, fetchVideoDetailsByIds, isHighlightUsable } = require('./youtubeHighlightsService');
const {
  metaFromSearchItem,
  serializeHighlightsMeta,
  fetchMetaForUrl,
} = require('./highlightsMetaService');
const { extractYoutubeId } = require('../utils/youtubeUrl');

function parseIntOr(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

function buildCandidateWhere(options = {}) {
  const lookbackHours = parseIntOr(options.lookbackHours, 72);
  const backfillAll = options.backfillAll === true;
  const refreshMetadataOnly = options.refreshMetadataOnly === true;
  const replaceBlockedHighlights = options.replaceBlockedHighlights === true;
  const reloadAllHighlights = options.reloadAllHighlights === true;

  if (reloadAllHighlights) {
    return { status: 'finished' };
  }

  if (replaceBlockedHighlights) {
    return {
      status: 'finished',
      highlightsUrl: { [Op.ne]: null },
    };
  }

  if (refreshMetadataOnly) {
    return {
      status: 'finished',
      highlightsUrl: { [Op.ne]: null },
      [Op.or]: [
        { highlightsMetaJson: null },
        { highlightsMetaJson: '' },
      ],
    };
  }

  const where = {
    status: 'finished',
    highlightsUrl: { [Op.is]: null },
  };

  if (!backfillAll && lookbackHours > 0) {
    const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
    where.kickoffTime = { [Op.gte]: since.toISOString() };
  }

  return where;
}

async function applyHighlightSelection(match, best) {
  if (!best?.url) return false;
  match.highlightsUrl = best.url;
  match.highlightsMetaJson = serializeHighlightsMeta(metaFromSearchItem(best));
  await match.save();
  return true;
}

async function refreshMatchHighlightMetadata(match) {
  const meta = await fetchMetaForUrl(match.highlightsUrl);
  if (!meta) return false;
  match.highlightsMetaJson = serializeHighlightsMeta(meta);
  await match.save();
  return true;
}

async function isStoredHighlightUnusable(url) {
  const videoId = extractYoutubeId(url);
  if (!videoId) return true;
  const rows = await fetchVideoDetailsByIds([videoId]);
  const row = rows[0];
  if (!row) return true;
  return !isHighlightUsable(row);
}

async function reselectHighlightForMatch(match, { maxResults = 6 } = {}) {
  const result = await searchMatchHighlights(match.toJSON(), { maxResults });
  const best = Array.isArray(result?.items) ? result.items[0] : null;
  if (!best?.url) {
    match.highlightsUrl = null;
    match.highlightsMetaJson = null;
    await match.save();
    return false;
  }
  return applyHighlightSelection(match, best);
}

async function autoFillHighlightsForFinishedMatches(options = {}) {
  const lookbackHours = parseIntOr(options.lookbackHours, 72);
  const maxUpdates = parseIntOr(options.maxUpdates, 5);
  const maxResults = parseIntOr(options.maxResults, 6);
  const backfillAll = options.backfillAll === true;
  const refreshMetadataOnly = options.refreshMetadataOnly === true;
  const replaceBlockedHighlights = options.replaceBlockedHighlights === true;
  const reloadAllHighlights = options.reloadAllHighlights === true;

  const candidateLimit = reloadAllHighlights || replaceBlockedHighlights
    ? Math.max(maxUpdates, 50)
    : Math.max(0, maxUpdates);

  const candidates = await Match.findAll({
    where: buildCandidateWhere({
      lookbackHours,
      backfillAll,
      refreshMetadataOnly,
      replaceBlockedHighlights,
      reloadAllHighlights,
    }),
    order: [['kickoffTime', 'DESC']],
    limit: candidateLimit,
  });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const match of candidates) {
    try {
      if (reloadAllHighlights || replaceBlockedHighlights) {
        if (replaceBlockedHighlights) {
          const unusable = await isStoredHighlightUnusable(match.highlightsUrl);
          if (!unusable) {
            skippedCount += 1;
            continue;
          }
        }
        const ok = await reselectHighlightForMatch(match, { maxResults });
        if (ok) updatedCount += 1;
        else skippedCount += 1;
        continue;
      }

      if (refreshMetadataOnly) {
        const ok = await refreshMatchHighlightMetadata(match);
        if (ok) updatedCount += 1;
        else skippedCount += 1;
        continue;
      }

      const result = await searchMatchHighlights(match.toJSON(), { maxResults });
      const best = Array.isArray(result?.items) ? result.items[0] : null;
      const ok = await applyHighlightSelection(match, best);
      if (ok) updatedCount += 1;
      else skippedCount += 1;
    } catch (error) {
      console.warn(`[Highlights] Auto-fill failed for matchId=${match.id}: ${error?.message || 'unknown error'}`);
      skippedCount += 1;
    }
  }

  return {
    message: reloadAllHighlights
      ? `reloaded=${updatedCount} scanned=${candidates.length} skipped=${skippedCount}`
      : replaceBlockedHighlights
      ? `replaced=${updatedCount} scanned=${candidates.length} skipped=${skippedCount}`
      : refreshMetadataOnly
      ? `metadataUpdated=${updatedCount} scanned=${candidates.length} skipped=${skippedCount}`
      : `updated=${updatedCount} scanned=${candidates.length} skipped=${skippedCount} lookbackHours=${backfillAll ? 'all' : lookbackHours}`,
    updatedCount,
    scannedCount: candidates.length,
    skippedCount,
    lookbackHours: backfillAll ? null : lookbackHours,
    backfillAll,
    refreshMetadataOnly,
    replaceBlockedHighlights,
    reloadAllHighlights,
  };
}

module.exports = {
  autoFillHighlightsForFinishedMatches,
  buildCandidateWhere,
  applyHighlightSelection,
  refreshMatchHighlightMetadata,
  isStoredHighlightUnusable,
  reselectHighlightForMatch,
};
