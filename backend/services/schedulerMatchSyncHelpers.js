const { Op } = require('sequelize');
const { Match } = require('../models');

const AWAITING_RESULT_KICKOFF_AGE_MS = parseInt(
  process.env.FOOTBALL_AWAITING_RESULT_KICKOFF_AGE_MS || String(105 * 60 * 1000),
  10,
);

const AUTO_RESULT_SYNC_MIN_INTERVAL_MS = parseInt(
  process.env.FOOTBALL_AUTO_RESULT_SYNC_MIN_INTERVAL_MS || String(10 * 60 * 1000),
  10,
);

let lastAutoResultSyncAt = 0;

async function hasLiveOrHalftimeMatches() {
  const count = await Match.count({
    where: { status: { [Op.in]: ['live', 'halftime'] } },
  });
  return count > 0;
}

async function hasMatchesAwaitingFinalResult() {
  const kickoffCutoff = new Date(Date.now() - AWAITING_RESULT_KICKOFF_AGE_MS);
  const count = await Match.count({
    where: {
      status: { [Op.in]: ['scheduled', 'live', 'halftime'] },
      kickoffTime: { [Op.lte]: kickoffCutoff.toISOString() },
    },
  });
  return count > 0;
}

function shouldRunAutoResultSync(now = Date.now()) {
  if (!lastAutoResultSyncAt) return true;
  return now - lastAutoResultSyncAt >= AUTO_RESULT_SYNC_MIN_INTERVAL_MS;
}

function markAutoResultSyncCompleted(now = Date.now()) {
  lastAutoResultSyncAt = now;
}

function resetAutoResultSyncStateForTests() {
  lastAutoResultSyncAt = 0;
}

module.exports = {
  hasLiveOrHalftimeMatches,
  hasMatchesAwaitingFinalResult,
  shouldRunAutoResultSync,
  markAutoResultSyncCompleted,
  resetAutoResultSyncStateForTests,
  AWAITING_RESULT_KICKOFF_AGE_MS,
  AUTO_RESULT_SYNC_MIN_INTERVAL_MS,
};
