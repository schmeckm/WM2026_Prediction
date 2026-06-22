const express = require('express');
const { sendError, translate } = require('../utils/apiResponse');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { syncFixtures } = require('../services/fixtureSyncService');
const { enrichMatchVenuesFromTheSportsDb, enrichCitiesFromWm2026Lookup } = require('../services/theSportsDbVenueService');
const { syncOfficialWm2026Schedule } = require('../services/wm2026OfficialSyncService');
const { testTheSportsDbConnection } = require('../services/playerImageProviderService');
const {
  syncPlayerImages,
  isStaleRunningLog,
  parseLogDetails,
} = require('../services/playerImageSyncService');
const { syncResults } = require('../services/resultSyncService');
const { syncLiveScores } = require('../services/liveScoreSyncService');
const { recalculateAllPoints } = require('../services/leaderboardService');
const footballProviderService = require('../services/footballProviderService');
const {
  getSyncLogs,
  getSyncStatusSummary,
  getSyncErrors,
  getLastSync,
  startSyncLog,
  failSyncLog,
} = require('../services/syncLogService');
const { syncMarketOdds } = require('../services/oddsSyncService');
const oddsApiService = require('../services/oddsApiService');
const { getSetting } = require('../services/settingsService');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

function handleSyncError(error, res, req) {
  const message = error.message || translate(req, 'errors.syncFailed');
  let status = 500;
  let code = error.code;

  if (error.code === 'NO_API_KEY') {
    status = 503;
  } else if (error.status === 403 || /\b403\b/.test(message)) {
    status = 503;
    code = code || 'API_AUTH_FAILED';
  } else if (error.status === 429 || /\b429\b|Rate-Limit/i.test(message)) {
    status = 503;
    code = code || 'RATE_LIMIT';
  }

  res.status(status).json({ error: message, code });
}

router.get('/status', async (req, res) => {
  try {
    const status = await getSyncStatusSummary();
    res.json(status);
  } catch (error) {
    sendError(res, req, 500, 'errors.syncStatusLoadFailed');
  }
});

router.get('/providers', (req, res) => {
  res.json({ providers: footballProviderService.getSupportedProviders() });
});

router.get('/logs', async (req, res) => {
  try {
    const logs = await getSyncLogs({
      limit: parseInt(req.query.limit || '50', 10),
      syncType: req.query.syncType || null,
      status: req.query.status || null,
    });
    res.json(logs);
  } catch (error) {
    sendError(res, req, 500, 'errors.syncLogsLoadFailed');
  }
});

router.get('/errors', async (req, res) => {
  try {
    const errors = await getSyncErrors({ limit: parseInt(req.query.limit || '20', 10) });
    res.json(errors);
  } catch (error) {
    sendError(res, req, 500, 'errors.syncErrorsLoadFailed');
  }
});

router.post('/test-connection', async (req, res) => {
  try {
    const result = await footballProviderService.testConnection();
    res.json(result);
  } catch (error) {
    handleSyncError(error, res, req);
  }
});

router.put('/provider', async (req, res) => {
  const config = await footballProviderService.getProviderConfig();
  res.json({
    message: 'football-data.org v4 ist der feste Primary-Provider.',
    config,
  });
});

router.post('/fixtures', async (req, res) => {
  try {
    const result = await syncFixtures({ userId: req.user.id, req });
    res.json(result);
  } catch (error) {
    handleSyncError(error, res, req);
  }
});

router.post('/official-schedule', async (req, res) => {
  try {
    const result = await syncOfficialWm2026Schedule({ userId: req.user.id, req });
    res.json(result);
  } catch (error) {
    handleSyncError(error, res, req);
  }
});

router.post('/results', async (req, res) => {
  try {
    const result = await syncResults({ userId: req.user.id, req });
    res.json(result);
  } catch (error) {
    handleSyncError(error, res, req);
  }
});

router.post('/live-scores', async (req, res) => {
  try {
    const liveEnabled = await getSetting('liveScoresEnabled', true);
    if (!liveEnabled) {
      return res.json({ skipped: true, message: 'Live-Score-Sync ist deaktiviert.' });
    }
    const force = req.body?.force === true;
    const result = await syncLiveScores({ userId: req.user.id, req, force });
    res.json(result);
  } catch (error) {
    handleSyncError(error, res, req);
  }
});

router.post('/enrich-venues', async (req, res) => {
  try {
    const theSportsDbResult = await enrichMatchVenuesFromTheSportsDb();
    res.json(theSportsDbResult);
  } catch (error) {
    handleSyncError(error, res, req);
  }
});

router.post('/enrich-venue-cities', async (req, res) => {
  try {
    const result = await enrichCitiesFromWm2026Lookup();
    res.json(result);
  } catch (error) {
    handleSyncError(error, res, req);
  }
});

router.post('/test-thesportsdb', async (req, res) => {
  try {
    const result = await testTheSportsDbConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/player-images', async (req, res) => {
  try {
    let resumeFromIndex = 0;
    const running = await getLastSync('player_images');
    if (running?.status === 'running') {
      if (!isStaleRunningLog(running)) {
        const resolved = (running.createdCount || 0) + (running.updatedCount || 0);
        return res.json({
          started: false,
          running: true,
          logId: running.id,
          message: `Spielerbild-Sync läuft bereits (${resolved} Bilder, ${running.skippedCount || 0} übersprungen)…`,
        });
      }
      resumeFromIndex = parseLogDetails(running).processedCount || 0;
      await failSyncLog(running, new Error('Vorheriger Sync nach Timeout abgebrochen.'));
    }

    const forceRefresh = req.body?.forceRefresh === true;
    const log = await startSyncLog('player_images', 'thesportsdb+wikidata');

    const resumeHint = resumeFromIndex > 0
      ? ` Fortsetzung ab Spieler ${resumeFromIndex + 1}.`
      : '';

    res.json({
      started: true,
      running: true,
      logId: log.id,
      resumeFromIndex,
      message: `Spielerbild-Sync im Hintergrund gestartet (~20 Min. für alle Kader).${resumeHint} Fortschritt in den Sync-Logs.`,
    });

    syncPlayerImages({
      userId: req.user.id,
      req,
      forceRefresh,
      log,
      resumeFromIndex,
    }).catch((error) => {
      console.error('Background player image sync failed:', error);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/recalculate-points', async (req, res) => {
  try {
    const result = await recalculateAllPoints();
    res.json({ message: 'Punkte neu berechnet.', ...result });
  } catch (error) {
    sendError(res, req, 500, 'errors.recalculateFailed');
  }
});

router.post('/test-odds-api', async (req, res) => {
  try {
    const result = await oddsApiService.testConnection();
    res.json(result);
  } catch (error) {
    handleSyncError(error, res, req);
  }
});

router.post('/market-odds', async (req, res) => {
  try {
    const result = await syncMarketOdds({ userId: req.user.id, req });
    res.json(result);
  } catch (error) {
    if (error.code === 'NO_API_KEY') {
      return res.status(503).json({ error: error.message, code: error.code });
    }
    handleSyncError(error, res, req);
  }
});

router.post('/highlights', async (req, res) => {
  try {
    const { autoFillHighlightsForFinishedMatches } = require('../services/highlightsAutofillService');
    const result = await autoFillHighlightsForFinishedMatches({
      lookbackHours: req.body?.lookbackHours,
      maxUpdates: req.body?.maxUpdates,
      maxResults: req.body?.maxResults,
      backfillAll: req.body?.backfillAll === true,
      refreshMetadataOnly: req.body?.refreshMetadataOnly === true,
      replaceBlockedHighlights: req.body?.replaceBlockedHighlights === true,
      reloadAllHighlights: req.body?.reloadAllHighlights === true,
    });
    res.json(result);
  } catch (error) {
    if (error?.code === 'YOUTUBE_API_KEY_MISSING') {
      return sendError(res, req, 503, 'errors.youtubeApiKeyMissing');
    }
    handleSyncError(error, res, req);
  }
});

module.exports = router;
