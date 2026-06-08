const { getSetting } = require('./settingsService');

async function canExposePredictionScores(match) {
  if (!match) return false;

  const showBefore = await getSetting('showPredictionsBeforeKickoff', true);
  const showAfter = await getSetting('showPredictionsAfterKickoff', false);

  const kickoff = match.kickoffTime ? new Date(match.kickoffTime) : null;
  const now = new Date();
  const isFinished = match.status === 'finished';
  const hasStarted = kickoff ? kickoff <= now : match.status !== 'scheduled';

  if (isFinished || hasStarted) {
    return showAfter;
  }
  return showBefore;
}

function redactPredictionScores(prediction, allowed) {
  if (!prediction || allowed) {
    return typeof prediction?.toJSON === 'function' ? prediction.toJSON() : prediction;
  }
  const json = typeof prediction.toJSON === 'function' ? prediction.toJSON() : { ...prediction };
  delete json.predictedHomeScore;
  delete json.predictedAwayScore;
  json.scoresHidden = true;
  return json;
}

async function sanitizePredictionsForViewer(predictions, viewer, { alwaysAllow = false } = {}) {
  const list = Array.isArray(predictions) ? predictions : [];
  if (alwaysAllow || viewer?.role === 'admin') {
    return list.map((p) => (typeof p.toJSON === 'function' ? p.toJSON() : p));
  }

  const matchCache = new Map();
  const result = [];

  for (const prediction of list) {
    const match = prediction.match || prediction.Match;
    const matchId = match?.id || prediction.matchId;
    let allowed = prediction.userId === viewer?.id;

    if (!allowed && match) {
      const cacheKey = matchId || `${match.status}-${match.kickoffTime}`;
      if (!matchCache.has(cacheKey)) {
        matchCache.set(cacheKey, await canExposePredictionScores(match));
      }
      allowed = matchCache.get(cacheKey);
    }

    result.push(redactPredictionScores(prediction, allowed));
  }

  return result;
}

module.exports = {
  canExposePredictionScores,
  redactPredictionScores,
  sanitizePredictionsForViewer,
};
