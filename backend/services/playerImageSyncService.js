const footballTeamService = require('./footballTeamService');
const { logAudit } = require('./auditService');
const { startSyncLog, finishSyncLog, failSyncLog, emptySummary } = require('./syncLogService');
const {
  findRecord,
  resolveImage,
} = require('./playerImageService');
const { isEnabled } = require('./playerImageProviderService');

async function syncPlayerImages({ userId = null, req = null, forceRefresh = false } = {}) {
  if (!isEnabled()) {
    return { skipped: true, message: 'Spielerbilder sind deaktiviert (PLAYER_IMAGE_ENABLED=false).' };
  }

  if (!footballTeamService.isFootballApiAvailable()) {
    return {
      skipped: true,
      message: 'football-data.org API nicht konfiguriert – WM-Kader können nicht geladen werden.',
    };
  }

  const log = await startSyncLog('player_images', 'thesportsdb+wikidata');
  const summary = emptySummary();

  try {
    const players = await footballTeamService.getAllSquadPlayers();
    summary.totalPlayers = players.length;

    if (!players.length) {
      summary.skippedCount = 0;
      await finishSyncLog(log, summary);
      return {
        logId: log.id,
        ...summary,
        message: 'Keine Spieler in den WM-Kadern gefunden.',
      };
    }

    for (const player of players) {
      try {
        const existing = await findRecord(player.playerName, player.teamName);
        const hadImage = !!existing?.imageUrl;

        const result = await resolveImage({
          playerName: player.playerName,
          teamName: player.teamName,
          countryCode: player.countryCode,
          forceRefresh,
        });

        if (!result?.imageUrl) {
          summary.skippedCount++;
          continue;
        }

        if (!hadImage) {
          summary.createdCount++;
        } else if (existing.imageUrl !== result.imageUrl) {
          summary.updatedCount++;
        } else {
          summary.skippedCount++;
        }
      } catch (err) {
        summary.errorCount++;
        summary.errors = summary.errors || [];
        summary.errors.push({
          player: player.playerName,
          team: player.teamName,
          message: err.message,
        });
      }
    }

    await finishSyncLog(log, summary);

    if (userId) {
      await logAudit({
        userId,
        action: 'SYNC_PLAYER_IMAGES',
        entityType: 'SyncLog',
        entityId: log.id,
        newValue: summary,
        req,
      });
    }

    const resolved = summary.createdCount + summary.updatedCount;
    return {
      logId: log.id,
      ...summary,
      message: `Spielerbilder synchronisiert: ${resolved} mit Bild (${summary.createdCount} neu, ${summary.updatedCount} aktualisiert), ${summary.skippedCount} ohne Änderung, ${summary.errorCount} Fehler.`,
    };
  } catch (error) {
    await failSyncLog(log, error, summary);
    throw error;
  }
}

module.exports = { syncPlayerImages };
