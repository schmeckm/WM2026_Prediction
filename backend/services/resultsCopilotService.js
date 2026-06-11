const { Op } = require('sequelize');
const { Match } = require('../models');
const { getDigestTimezone } = require('./morningDigestService');

const PENDING_STATUSES = ['scheduled', 'live', 'halftime'];

function getDateStringInTimezone(date, timezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
}

function isDateInTimezone(kickoffTime, timezone, dateStr) {
  return getDateStringInTimezone(new Date(kickoffTime), timezone) === dateStr;
}

async function getMatchSummaryForDate({ timezone = getDigestTimezone(), dateStr = null, dayOffset = 0 } = {}) {
  const baseDate = new Date();
  if (Number.isInteger(dayOffset) && dayOffset !== 0) {
    baseDate.setDate(baseDate.getDate() + dayOffset);
  }
  const targetStr = dateStr || getDateStringInTimezone(baseDate, timezone);

  // Keep the DB query bounded; filter to exact day in timezone afterwards.
  const matches = await Match.findAll({
    where: {
      kickoffTime: {
        [Op.gte]: new Date(Date.now() - 72 * 60 * 60 * 1000),
        [Op.lte]: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    },
    order: [['kickoffTime', 'ASC']],
  });

  const dayMatches = matches.filter((m) => isDateInTimezone(m.kickoffTime, timezone, targetStr));
  const pending = dayMatches.filter((m) => PENDING_STATUSES.includes(m.status));
  const finished = dayMatches.filter((m) => m.status === 'finished');

  return {
    timezone,
    date: targetStr,
    pending,
    finished,
    matches: dayMatches,
  };
}

module.exports = {
  PENDING_STATUSES,
  getDateStringInTimezone,
  getMatchSummaryForDate,
};
