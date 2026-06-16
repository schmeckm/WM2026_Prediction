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

function attachMarketOdds(matchJson) {
  if (!matchJson || typeof matchJson !== 'object') return matchJson;
  const marketOdds = parseMarketOddsJson(matchJson.marketOddsJson);
  const { marketOddsJson, ...rest } = matchJson;
  return marketOdds ? { ...rest, marketOdds } : rest;
}

function attachMarketOddsList(matches) {
  return matches.map((match) => attachMarketOdds(match));
}

module.exports = {
  parseMarketOddsJson,
  attachMarketOdds,
  attachMarketOddsList,
};
