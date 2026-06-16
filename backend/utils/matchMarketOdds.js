function parseMarketOddsJson(raw) {
  if (!raw) return null;
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data?.probabilities) return null;
    return {
      bookmaker: data.bookmaker || null,
      decimalOdds: data.decimalOdds || null,
      probabilities: data.probabilities,
      fetchedAt: data.fetchedAt || null,
    };
  } catch {
    return null;
  }
}

function resolveDisplayMarketOdds(matchJson) {
  const kickoff = parseMarketOddsJson(matchJson?.marketOddsAtKickoffJson);
  const latest = parseMarketOddsJson(matchJson?.marketOddsJson);
  const status = matchJson?.status;
  const useKickoff = ['finished', 'locked'].includes(status) || (status === 'live' && kickoff);
  const data = (useKickoff && kickoff) ? kickoff : (latest || kickoff);
  if (!data) return null;
  return {
    ...data,
    source: (useKickoff && kickoff) ? 'kickoff' : 'live',
  };
}

function attachMarketOdds(matchJson) {
  if (!matchJson || typeof matchJson !== 'object') return matchJson;
  const marketOdds = resolveDisplayMarketOdds(matchJson);
  const { marketOddsJson, marketOddsAtKickoffJson, ...rest } = matchJson;
  return marketOdds ? { ...rest, marketOdds } : rest;
}

function attachMarketOddsList(matches) {
  return matches.map((match) => attachMarketOdds(match));
}

module.exports = {
  parseMarketOddsJson,
  resolveDisplayMarketOdds,
  attachMarketOdds,
  attachMarketOddsList,
};
