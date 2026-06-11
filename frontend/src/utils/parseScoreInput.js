const MAX_SCORE = 20;

export function parseScoreInput(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'empty' };
  }

  let rest = trimmed;
  let matchNumber = null;
  const prefixMatch = trimmed.match(/^#?(\d+)\s+(.+)$/);
  if (prefixMatch) {
    matchNumber = parseInt(prefixMatch[1], 10);
    rest = prefixMatch[2].trim();
  }

  const scoreMatch = rest.match(/^(\d+)\s*[:\-–]\s*(\d+)$/);
  if (!scoreMatch) {
    return { ok: false, error: 'invalidFormat' };
  }

  const homeScore = parseInt(scoreMatch[1], 10);
  const awayScore = parseInt(scoreMatch[2], 10);

  if (
    Number.isNaN(homeScore)
    || Number.isNaN(awayScore)
    || homeScore < 0
    || awayScore < 0
    || homeScore > MAX_SCORE
    || awayScore > MAX_SCORE
  ) {
    return { ok: false, error: 'outOfRange', max: MAX_SCORE };
  }

  return { ok: true, homeScore, awayScore, matchNumber };
}
