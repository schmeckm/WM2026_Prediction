const { teamsMatch } = require('../data/wm2026ScheduleLookup');
const { calculateProbabilities } = require('../utils/oddsProbability');
const { parseMarketOddsJson } = require('../utils/matchMarketOdds');

const DEFAULT_BASE_URL = 'https://api.the-odds-api.com/v4';
const DEFAULT_SPORT_KEY = 'soccer_fifa_world_cup';
const CACHE_TTL_MS = 60 * 60 * 1000;
const KICKOFF_TOLERANCE_MS = 48 * 60 * 60 * 1000;

let cache = {
  at: 0,
  games: null,
  quota: null,
};

function getConfig() {
  const regions = process.env.ODDS_API_REGIONS || 'eu';
  const markets = process.env.ODDS_API_MARKETS || 'h2h';
  return {
    apiKey: process.env.ODDS_API_KEY || '',
    baseUrl: process.env.ODDS_API_BASE_URL || DEFAULT_BASE_URL,
    sportKey: process.env.ODDS_API_SPORT_KEY || DEFAULT_SPORT_KEY,
    regions,
    markets,
    oddsFormat: process.env.ODDS_API_ODDS_FORMAT || 'decimal',
    enabled: process.env.ODDS_API_ENABLED !== 'false',
    quotaCostPerOddsRequest: regions.split(',').filter(Boolean).length
      * markets.split(',').filter(Boolean).length,
  };
}

function isConfigured(config = getConfig()) {
  return Boolean(config.enabled && config.apiKey);
}

function parseQuotaHeaders(response) {
  const remaining = response.headers.get('x-requests-remaining');
  const used = response.headers.get('x-requests-used');
  const lastCost = response.headers.get('x-requests-last');
  return {
    requestsRemaining: remaining != null ? Number(remaining) : null,
    requestsUsed: used != null ? Number(used) : null,
    requestsLast: lastCost != null ? Number(lastCost) : null,
  };
}

function getQuotaState() {
  return cache.quota ? { ...cache.quota } : null;
}

async function apiRequest(path, { searchParams = {}, expectJson = true } = {}) {
  const config = getConfig();
  if (!isConfigured(config)) {
    const err = new Error('ODDS_API_KEY ist nicht konfiguriert.');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const url = new URL(`${config.baseUrl}${path}`);
  for (const [key, value] of Object.entries(searchParams)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  }
  url.searchParams.set('apiKey', config.apiKey);

  const response = await fetch(url);
  const quota = parseQuotaHeaders(response);
  cache.quota = { ...quota, checkedAt: new Date().toISOString() };

  if (response.status === 429) {
    const err = new Error('The Odds API Rate-Limit erreicht (429). Bitte kurz warten.');
    err.code = 'RATE_LIMITED';
    err.status = 429;
    err.quota = quota;
    throw err;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const err = new Error(`The Odds API ${response.status}${body ? `: ${body.slice(0, 160)}` : ''}`);
    err.status = response.status;
    err.quota = quota;
    throw err;
  }

  if (!expectJson) {
    return { quota, data: null };
  }

  const data = await response.json();
  return { quota, data };
}

function extractH2hOdds(game) {
  for (const bookmaker of game.bookmakers || []) {
    const market = (bookmaker.markets || []).find((m) => m.key === 'h2h');
    if (!market?.outcomes?.length) continue;

    const byName = Object.fromEntries(
      market.outcomes.map((o) => [o.name, o.price]),
    );

    const homeOdds = byName[game.home_team];
    const awayOdds = byName[game.away_team];
    const drawOdds = Object.entries(byName).find(
      ([name]) => name !== game.home_team && name !== game.away_team,
    )?.[1];

    if (homeOdds && drawOdds && awayOdds) {
      return {
        bookmaker: bookmaker.title,
        decimalOdds: { home: homeOdds, draw: drawOdds, away: awayOdds },
        probabilities: calculateProbabilities(homeOdds, drawOdds, awayOdds),
      };
    }
  }
  return null;
}

function gameMatchesFixture(game, homeTeam, awayTeam, kickoffTime = null) {
  if (!teamsMatch(game.home_team, homeTeam) || !teamsMatch(game.away_team, awayTeam)) {
    return false;
  }
  if (!kickoffTime) return true;

  const kickoff = new Date(kickoffTime).getTime();
  const commence = new Date(game.commence_time).getTime();
  if (Number.isNaN(kickoff) || Number.isNaN(commence)) return true;

  return Math.abs(kickoff - commence) <= KICKOFF_TOLERANCE_MS;
}

async function listSports({ all = false } = {}) {
  const { quota, data } = await apiRequest('/sports/', {
    searchParams: all ? { all: 'true' } : {},
  });
  return { sports: data, quota, quotaCost: 0 };
}

async function fetchSportEvents() {
  const config = getConfig();
  const { quota, data } = await apiRequest(`/sports/${config.sportKey}/events`);
  return { events: data, quota, quotaCost: 0 };
}

async function fetchOddsGames({ force = false } = {}) {
  const config = getConfig();
  if (!isConfigured(config)) {
    return { games: [], configured: false };
  }

  const isFresh = cache.games && Date.now() - cache.at < CACHE_TTL_MS;
  if (!force && isFresh) {
    return {
      games: cache.games,
      configured: true,
      cached: true,
      quota: cache.quota,
      quotaCost: 0,
    };
  }

  const { quota, data } = await apiRequest(`/sports/${config.sportKey}/odds`, {
    searchParams: {
      regions: config.regions,
      markets: config.markets,
      oddsFormat: config.oddsFormat,
    },
  });

  const games = Array.isArray(data) ? data : [];
  cache = {
    at: Date.now(),
    games,
    quota,
  };

  return {
    games,
    configured: true,
    cached: false,
    quota,
    quotaCost: games.length > 0 ? config.quotaCostPerOddsRequest : 0,
  };
}

function findOddsForTeams(games, homeTeam, awayTeam, kickoffTime = null) {
  const game = (games || []).find((entry) => gameMatchesFixture(entry, homeTeam, awayTeam, kickoffTime));
  if (!game) return null;

  const odds = extractH2hOdds(game);
  if (!odds) return null;

  return {
    ...odds,
    eventId: game.id || null,
    commenceTime: game.commence_time,
    homeTeam: game.home_team,
    awayTeam: game.away_team,
  };
}

async function getMarketOddsForMatch(match) {
  const config = getConfig();
  if (!isConfigured(config)) {
    return { available: false, reason: 'not_configured' };
  }

  if (!match) {
    return { available: false, reason: 'match_finished_or_missing' };
  }

  const stored = parseMarketOddsJson(match.marketOddsJson);
  if (stored?.probabilities) {
    return {
      available: true,
      source: 'stored',
      bookmaker: stored.bookmaker,
      decimalOdds: stored.decimalOdds,
      probabilities: stored.probabilities,
      fetchedAt: stored.fetchedAt,
    };
  }

  if (match.status === 'finished') {
    return { available: false, reason: 'no_market_data' };
  }

  try {
    const { games, cached, quota } = await fetchOddsGames();
    const odds = findOddsForTeams(games, match.homeTeam, match.awayTeam, match.kickoffTime);

    if (!odds) {
      return {
        available: false,
        reason: 'no_market_data',
        cached,
        quota,
      };
    }

    return {
      available: true,
      source: 'live',
      bookmaker: odds.bookmaker,
      decimalOdds: odds.decimalOdds,
      probabilities: odds.probabilities,
      commenceTime: odds.commenceTime,
      cached,
      fetchedAt: new Date(cache.at).toISOString(),
      quota,
    };
  } catch (error) {
    return {
      available: false,
      reason: error.code === 'RATE_LIMITED' ? 'rate_limited' : 'api_error',
      detail: error.message?.slice(0, 200) || null,
      quota: error.quota || getQuotaState(),
    };
  }
}

async function testConnection() {
  const config = getConfig();
  if (!isConfigured(config)) {
    return { ok: false, reason: 'not_configured' };
  }

  const { sports, quota } = await listSports();
  const sport = sports.find((s) => s.key === config.sportKey);
  const { events, quota: eventsQuota } = await fetchSportEvents();

  return {
    ok: true,
    message: 'The Odds API verbunden.',
    sportKey: config.sportKey,
    sportTitle: sport?.title || null,
    sportActive: sport?.active ?? null,
    sportDescription: sport?.description || null,
    upcomingEvents: events.length,
    regions: config.regions,
    markets: config.markets,
    quotaCostPerOddsSync: config.quotaCostPerOddsRequest,
    quota: eventsQuota || quota,
    requestsRemaining: (eventsQuota || quota)?.requestsRemaining ?? null,
    endpoints: {
      sports: 'GET /v4/sports/ (0 credits)',
      events: `GET /v4/sports/${config.sportKey}/events (0 credits)`,
      odds: `GET /v4/sports/${config.sportKey}/odds (regions × markets credits)`,
    },
  };
}

function resetOddsCacheForTests() {
  cache = { at: 0, games: null, quota: null };
}

module.exports = {
  getConfig,
  isConfigured,
  getQuotaState,
  listSports,
  fetchSportEvents,
  fetchOddsGames,
  findOddsForTeams,
  getMarketOddsForMatch,
  testConnection,
  resetOddsCacheForTests,
};
