function getDateStringInTimezone(date, timeZone) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function getTodayDateString(timeZone = 'Europe/Zurich') {
  return getDateStringInTimezone(new Date(), timeZone);
}

function isKickoffOnDate(kickoffTime, dateStr, timeZone = 'Europe/Zurich') {
  if (!kickoffTime || !dateStr) return false;
  return getDateStringInTimezone(kickoffTime, timeZone) === dateStr;
}

module.exports = {
  getDateStringInTimezone,
  getTodayDateString,
  isKickoffOnDate,
};
