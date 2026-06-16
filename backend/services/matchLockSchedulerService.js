const { Op } = require('sequelize');
const { Match } = require('../models');

async function lockPastKickoffMatches() {
  const now = new Date();
  const matches = await Match.findAll({
    where: {
      status: 'scheduled',
      kickoffTime: { [Op.lte]: now },
      isManuallyLocked: false,
    },
  });

  let locked = 0;
  for (const match of matches) {
    const updates = { status: 'locked' };
    if (match.marketOddsJson && !match.marketOddsAtKickoffJson) {
      updates.marketOddsAtKickoffJson = match.marketOddsJson;
    }
    await match.update(updates);
    locked += 1;
  }

  return { locked, checkedAt: now.toISOString() };
}

module.exports = { lockPastKickoffMatches };
