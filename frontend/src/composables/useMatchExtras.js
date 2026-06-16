export function hasDisplayableResult(match) {
  if (!match) return false;
  const hasScore = match.homeScore !== null && match.homeScore !== undefined
    && match.awayScore !== null && match.awayScore !== undefined;
  if (hasScore) {
    return match.status === 'live' || match.status === 'halftime' || match.status === 'finished';
  }
  const kickoffMs = new Date(match.kickoffTime).getTime();
  const startedByTime = Number.isFinite(kickoffMs) && Date.now() >= kickoffMs;
  const canHavePlaceholder = match.status !== 'cancelled' && match.status !== 'postponed';
  return startedByTime && canHavePlaceholder;
}

export function displayMatchScore(match) {
  const hasScore = match.homeScore !== null && match.homeScore !== undefined
    && match.awayScore !== null && match.awayScore !== undefined;
  if (hasScore) {
    return { home: match.homeScore, away: match.awayScore };
  }
  return { home: '–', away: '–' };
}

export function formatMarketProbabilities(match, t) {
  const probs = match?.marketOdds?.probabilities;
  if (!probs) return '';
  const key = match?.marketOdds?.source === 'kickoff' || match?.status === 'finished'
    ? 'matches.marketProbabilitiesKickoff'
    : 'matches.marketProbabilities';
  return t(key, {
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    home: probs.home,
    draw: probs.draw,
    away: probs.away,
  });
}

export function showMarketOdds(match) {
  if (!match?.marketOdds?.probabilities) return false;
  if (match.status === 'finished') return true;
  if (!['scheduled', 'locked', 'live', 'halftime'].includes(match.status)) return false;
  if (match.status === 'scheduled' || match.status === 'locked') {
    const kickoff = new Date(match.kickoffTime).getTime();
    return Number.isFinite(kickoff) && kickoff > Date.now();
  }
  return true;
}

export function showUpcomingMarketOdds(match) {
  return showMarketOdds(match) && match.status !== 'finished';
}
