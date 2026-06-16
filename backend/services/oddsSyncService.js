const { Op } = require('sequelize');
const { Match } = require('../models');
const oddsApiService = require('./oddsApiService');
const {
  startSyncLog,
  finishSyncLog,
  failSyncLog,
  emptySummary,
} = require('./syncLogService');
const { logAudit } = require('./auditService');
const socketService = require('./socketService');
const { attachMarketOdds } = require('../utils/matchMarketOdds');

function buildStoredMarketOdds(odds, quota) {
  return {
    bookmaker: odds.bookmaker,
    decimalOdds: odds.decimalOdds,
    probabilities: odds.probabilities,
    commenceTime: odds.commenceTime || null,
    fetchedAt: new Date().toISOString(),
    requestsRemaining: quota?.requestsRemaining ?? null,
  };
}

async function syncMarketOdds({ userId = null, req = null } = {}) {
  if (!oddsApiService.isConfigured()) {
    const err = new Error('ODDS_API_KEY ist nicht konfiguriert.');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const log = await startSyncLog('market_odds', 'the-odds-api');
  const summary = emptySummary();

  try {
    const { games, quota, quotaCost } = await oddsApiService.fetchOddsGames({ force: true });
    const matches = await Match.findAll({
      where: {
        status: { [Op.in]: ['scheduled', 'live', 'halftime', 'locked'] },
      },
      order: [['kickoffTime', 'ASC']],
    });

    for (const match of matches) {
      const odds = oddsApiService.findOddsForTeams(
        games,
        match.homeTeam,
        match.awayTeam,
        match.kickoffTime,
      );

      if (!odds) {
        summary.skippedCount += 1;
        continue;
      }

      await match.update({
        marketOddsJson: JSON.stringify(buildStoredMarketOdds(odds, quota)),
      });
      await match.reload();
      summary.updatedCount += 1;
      socketService.emitToMatches('match:update', attachMarketOdds(match.toJSON()));
    }

    summary.quota = quota || null;
    summary.quotaCost = quotaCost ?? null;
    summary.requestsRemaining = quota?.requestsRemaining ?? null;
    summary.matchedGames = games.length;
    await finishSyncLog(log, summary);

    if (userId) {
      await logAudit({
        userId,
        action: 'sync_market_odds',
        entityType: 'sync',
        entityId: String(log.id),
        details: summary,
        req,
      });
    }

    return {
      message: `Markt-Quoten synchronisiert: ${summary.updatedCount} Spiele aktualisiert, ${summary.skippedCount} ohne Quoten.`,
      ...summary,
      logId: log.id,
    };
  } catch (error) {
    await failSyncLog(log, error, summary);
    throw error;
  }
}

module.exports = { syncMarketOdds, buildStoredMarketOdds };
