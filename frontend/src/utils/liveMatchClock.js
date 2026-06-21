const FIRST_HALF_MS = 45 * 60 * 1000;
const HALFTIME_MS = 15 * 60 * 1000;

function formatMinSec(totalSeconds) {
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

/**
 * Estimate broadcast-style match clock from kickoff time.
 * Returns "HT" during the assumed halftime break or when status is halftime.
 */
export function getLiveMatchClock(kickoffTime, status, now = Date.now()) {
  if (status === 'halftime') return 'HT';

  const kickoffMs = new Date(kickoffTime).getTime();
  if (!Number.isFinite(kickoffMs)) return 'LIVE';

  const elapsed = now - kickoffMs;
  if (elapsed < 0) return '0:00';

  if (elapsed <= FIRST_HALF_MS) {
    return formatMinSec(Math.floor(elapsed / 1000));
  }

  const secondHalfStart = FIRST_HALF_MS + HALFTIME_MS;
  if (elapsed < secondHalfStart) return 'HT';

  const playSeconds = Math.floor((elapsed - HALFTIME_MS) / 1000);
  const capped = Math.min(playSeconds, 120 * 60);
  return formatMinSec(capped);
}

export function isLiveScoreboardMatch(match, now = Date.now()) {
  if (!match) return false;
  if (match.status === 'live' || match.status === 'halftime') return true;

  const kickoffMs = new Date(match.kickoffTime).getTime();
  const startedByTime = Number.isFinite(kickoffMs) && now >= kickoffMs;
  const blocked = match.status === 'cancelled' || match.status === 'postponed' || match.status === 'finished';
  return startedByTime && !blocked;
}
