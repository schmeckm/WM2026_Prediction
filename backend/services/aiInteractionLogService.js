const { Op } = require('sequelize');
const { AIInteractionLog } = require('../models');

function isAiInteractionLoggingEnabled() {
  return process.env.AI_INTERACTION_LOG_ENABLED !== 'false';
}

function getAiInteractionLogRetentionDays() {
  const raw = process.env.AI_INTERACTION_LOG_RETENTION_DAYS;
  const parsed = raw ? Number.parseInt(raw, 10) : 90;
  if (!Number.isFinite(parsed) || parsed <= 0) return 90;
  return parsed;
}

async function cleanupOldAiInteractionLogs(options = {}) {
  if (!isAiInteractionLoggingEnabled()) {
    return { skipped: true, deletedCount: 0, retentionDays: getAiInteractionLogRetentionDays() };
  }

  const retentionDays = options.retentionDays ?? getAiInteractionLogRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const deletedCount = await AIInteractionLog.destroy({
    where: {
      createdAt: { [Op.lt]: cutoff },
    },
  });
  return { skipped: false, deletedCount, retentionDays };
}

async function deleteAiInteractionLogsForUser(userId) {
  if (!userId) return 0;
  return AIInteractionLog.destroy({ where: { userId } });
}

module.exports = {
  isAiInteractionLoggingEnabled,
  getAiInteractionLogRetentionDays,
  cleanupOldAiInteractionLogs,
  deleteAiInteractionLogsForUser,
};

