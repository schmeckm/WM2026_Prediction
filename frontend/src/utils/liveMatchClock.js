export function isLiveScoreboardMatch(match, now = Date.now()) {
  if (!match) return false;
  if (match.status === 'live' || match.status === 'halftime') return true;

  const kickoffMs = new Date(match.kickoffTime).getTime();
  const startedByTime = Number.isFinite(kickoffMs) && now >= kickoffMs;
  const blocked = match.status === 'cancelled' || match.status === 'postponed' || match.status === 'finished';
  return startedByTime && !blocked;
}
