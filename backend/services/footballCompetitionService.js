const footballDataProvider = require('./providers/footballDataProvider');
const { Op } = require('sequelize');
const { PlayerImage } = require('../models');
const { getProviderConfig, assertApiConfigured, isApiConfigured } = require('./footballProviderService');
const { enrichPlayersWithImages, resolveImage } = require('./playerImageService');
const { isEnabled: isPlayerImageEnabled, isExternalProviderPaused } = require('./playerImageProviderService');
const { aggregateTopScorers } = require('./theSportsDbScorersService');

const CACHE_TTL_MS = 15 * 60 * 1000;
const RESOLVE_DELAY_MS = 500;
const MAX_SCORER_IMAGE_RESOLVE = 10;

const cache = {
  standings: { data: null, fetchedAt: 0, key: '' },
  scorers: { data: null, fetchedAt: 0, key: '' },
};

function cacheKey(query) {
  return JSON.stringify(query || {});
}

function applyPlayerImageMeta(entry, meta) {
  if (!meta?.imageUrl) return entry;
  return {
    ...entry,
    player: {
      ...entry.player,
      imageUrl: meta.imageUrl,
      imageSource: meta.imageSource || null,
      imageAttribution: meta.imageAttribution || null,
      imageLicense: meta.imageLicense || null,
    },
  };
}

async function attachNameOnlyCachedImages(scorers) {
  const missingNames = [...new Set(
    scorers
      .filter((entry) => !entry.player?.imageUrl && entry.player?.name)
      .map((entry) => entry.player.name.trim()),
  )];
  if (!missingNames.length) return scorers;

  const records = await PlayerImage.findAll({
    where: {
      playerName: { [Op.in]: missingNames },
      imageUrl: { [Op.ne]: null },
    },
    order: [['lastCheckedAt', 'DESC']],
  });

  const byName = new Map();
  for (const record of records) {
    if (!byName.has(record.playerName)) {
      byName.set(record.playerName, record);
    }
  }

  return scorers.map((entry) => {
    if (entry.player?.imageUrl || !entry.player?.name) return entry;
    const record = byName.get(entry.player.name.trim());
    if (!record?.imageUrl) return entry;
    return applyPlayerImageMeta(entry, {
      imageUrl: record.imageUrl,
      imageSource: record.source,
      imageAttribution: record.attributionText || null,
      imageLicense: record.licenseInfo || null,
    });
  });
}

async function resolveMissingScorerImages(scorers, { maxResolve = MAX_SCORER_IMAGE_RESOLVE } = {}) {
  if (!isPlayerImageEnabled() || isExternalProviderPaused()) return scorers;

  const result = scorers.map((entry) => ({
    ...entry,
    player: { ...entry.player },
  }));

  let resolved = 0;
  for (const entry of result) {
    if (entry.player?.imageUrl || !entry.player?.name) continue;
    if (resolved >= maxResolve) break;

    try {
      if (resolved > 0) {
        await new Promise((resolve) => { setTimeout(resolve, RESOLVE_DELAY_MS); });
      }
      const record = await resolveImage({
        playerName: entry.player.name,
        teamName: entry.team?.name,
        countryCode: entry.player?.nationality,
      });
      if (!record?.imageUrl) continue;
      Object.assign(entry.player, {
        imageUrl: record.imageUrl,
        imageSource: record.source || null,
        imageAttribution: record.attributionText || null,
        imageLicense: record.licenseInfo || null,
      });
      resolved += 1;
    } catch (error) {
      console.warn(`resolveMissingScorerImages (${entry.player.name}):`, error.message);
    }
  }

  return result;
}

async function enrichScorerList(scorers) {
  const enrichedPlayers = await enrichPlayersWithImages(
    scorers.map((entry) => ({
      id: entry.player?.id,
      name: entry.player?.name,
      teamName: entry.team?.name,
      nationality: entry.player?.nationality,
    })),
  );

  const imageByKey = new Map(
    enrichedPlayers.map((p) => [`${p.name}|${p.teamName || ''}`, {
      imageUrl: p.imageUrl,
      imageSource: p.imageSource,
      imageAttribution: p.imageAttribution,
      imageLicense: p.imageLicense,
    }]),
  );

  let enriched = scorers.map((entry) => {
    const imageKey = `${entry.player?.name}|${entry.team?.name || ''}`;
    const meta = imageByKey.get(imageKey);
    return applyPlayerImageMeta(entry, meta);
  });

  enriched = await attachNameOnlyCachedImages(enriched);
  enriched = await resolveMissingScorerImages(enriched, {
    maxResolve: Math.min(MAX_SCORER_IMAGE_RESOLVE, enriched.length),
  });
  return enriched;
}

async function getStandings(query = {}) {
  const key = cacheKey(query);
  if (cache.standings.data && cache.standings.key === key && Date.now() - cache.standings.fetchedAt < CACHE_TTL_MS) {
    return cache.standings.data;
  }

  const config = await getProviderConfig();
  assertApiConfigured(config);
  const { standings } = await footballDataProvider.fetchStandings(config, query);

  cache.standings = { data: standings, fetchedAt: Date.now(), key };
  return standings;
}

async function getScorers(query = {}) {
  const limit = Math.max(1, parseInt(query.limit || '20', 10) || 20);
  const key = cacheKey({ ...query, limit });
  if (cache.scorers.data && cache.scorers.key === key && Date.now() - cache.scorers.fetchedAt < CACHE_TTL_MS) {
    return cache.scorers.data;
  }

  let scorers = [];
  let source = 'none';
  const config = await getProviderConfig();

  if (isApiConfigured(config)) {
    try {
      const { scorers: footballScorers } = await footballDataProvider.fetchScorers(config, {
        ...query,
        limit,
      });
      if (footballScorers?.length) {
        scorers = footballScorers;
        source = 'football-data';
      }
    } catch (error) {
      console.warn('Football-data scorers failed, trying TheSportsDB fallback:', error.message);
    }
  }

  if (!scorers.length) {
    const fallback = await aggregateTopScorers({ limit: Math.max(limit, 50) });
    if (fallback.length) {
      scorers = fallback;
      source = 'thesportsdb';
    }
  }

  const enriched = await enrichScorerList(scorers.slice(0, limit));
  const result = {
    scorers: enriched,
    source,
    top3: enriched.slice(0, 3),
  };

  cache.scorers = { data: result, fetchedAt: Date.now(), key };
  return result;
}

async function getLiveMatches(query = {}) {
  const config = await getProviderConfig();
  assertApiConfigured(config);
  const { matches } = await footballDataProvider.fetchFilteredMatches(config, query);
  return matches;
}

function resetFootballCompetitionCacheForTests() {
  cache.standings = { data: null, fetchedAt: 0, key: '' };
  cache.scorers = { data: null, fetchedAt: 0, key: '' };
}

module.exports = {
  getStandings,
  getScorers,
  getLiveMatches,
  isFootballApiAvailable: isApiConfigured,
  resetFootballCompetitionCacheForTests,
};
