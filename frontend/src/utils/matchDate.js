export const DEFAULT_MATCH_TIMEZONE = import.meta.env.VITE_DEFAULT_TIMEZONE || 'Europe/Zurich';

export function getDateStringInTimezone(date, timeZone = DEFAULT_MATCH_TIMEZONE) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

export function isKickoffOnDate(kickoffTime, dateStr, timeZone = DEFAULT_MATCH_TIMEZONE) {
  if (!kickoffTime || !dateStr) return false;
  return getDateStringInTimezone(kickoffTime, timeZone) === dateStr;
}

function matchBrowsePriority(match, todayStr, timeZone) {
  const kickoffMs = new Date(match.kickoffTime).getTime();
  const kickoffDate = getDateStringInTimezone(match.kickoffTime, timeZone);

  if (match.status === 'live' || match.status === 'halftime') return 0;
  if (kickoffDate === todayStr) return 1;
  if (match.status === 'scheduled' && Number.isFinite(kickoffMs) && kickoffMs > Date.now()) return 2;
  return 3;
}

export function sortMatchesForBrowse(matches, todayStr, timeZone = DEFAULT_MATCH_TIMEZONE) {
  return [...matches].sort((a, b) => {
    const priorityDiff = matchBrowsePriority(a, todayStr, timeZone) - matchBrowsePriority(b, todayStr, timeZone);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
  });
}
