const { fetchTheSportsDb, getTheSportsDbApiKey } = require('./providers/theSportsDbClient');

const DEFAULT_LEAGUE_ID = '4429';
const DEFAULT_SEASON = '2026';
const CACHE_TTL_MS = 15 * 60 * 1000;

let cache = { at: 0, scorers: null };

function parseGoalScorerName(raw) {
  if (!raw) return null;
  let name = String(raw).trim();
  if (!name) return null;
  name = name.replace(/\d{1,2}(?:\+\d+)?'/g, '').trim();
  name = name.replace(/\([^)]*\)/gi, '').trim();
  return name || null;
}

function parseGoalDetails(goalString) {
  if (!goalString) return [];
  return goalString
    .split(';')
    .map(parseGoalScorerName)
    .filter(Boolean);
}

function aggregateFromEvents(events) {
  const counts = new Map();

  for (const event of events || []) {
    const homeTeam = event.strHomeTeam || null;
    const awayTeam = event.strAwayTeam || null;

    for (const playerName of parseGoalDetails(event.strHomeGoalDetails)) {
      const key = `${playerName.toLowerCase()}|${(homeTeam || '').toLowerCase()}`;
      const entry = counts.get(key) || { playerName, teamName: homeTeam, goals: 0 };
      entry.goals += 1;
      counts.set(key, entry);
    }

    for (const playerName of parseGoalDetails(event.strAwayGoalDetails)) {
      const key = `${playerName.toLowerCase()}|${(awayTeam || '').toLowerCase()}`;
      const entry = counts.get(key) || { playerName, teamName: awayTeam, goals: 0 };
      entry.goals += 1;
      counts.set(key, entry);
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName));
}

function toScorerEntries(aggregated) {
  return aggregated.map((entry) => ({
    player: {
      id: null,
      name: entry.playerName,
      nationality: null,
      position: null,
    },
    team: {
      id: null,
      name: entry.teamName || null,
      crest: null,
    },
    goals: entry.goals,
    assists: null,
    penalties: null,
    source: 'thesportsdb',
  }));
}

async function fetchWorldCupEvents(config = {}) {
  const leagueId = config.leagueId
    || process.env.THESPORTSDB_LEAGUE_ID
    || DEFAULT_LEAGUE_ID;
  const season = config.season
    || process.env.THESPORTSDB_SEASON
    || DEFAULT_SEASON;

  const data = await fetchTheSportsDb('eventsseason.php', { id: leagueId, s: season }, config);
  return data.events || [];
}

async function aggregateTopScorers({ limit = 20, force = false } = {}) {
  if (!getTheSportsDbApiKey()) {
    return [];
  }

  const isFresh = cache.scorers && Date.now() - cache.at < CACHE_TTL_MS;
  if (!force && isFresh) {
    return cache.scorers.slice(0, limit);
  }

  const events = await fetchWorldCupEvents();
  const aggregated = aggregateFromEvents(events);
  const scorers = toScorerEntries(aggregated);
  cache = { at: Date.now(), scorers };
  return scorers.slice(0, limit);
}

function resetTheSportsDbScorersCacheForTests() {
  cache = { at: 0, scorers: null };
}

module.exports = {
  parseGoalScorerName,
  parseGoalDetails,
  aggregateFromEvents,
  aggregateTopScorers,
  resetTheSportsDbScorersCacheForTests,
};
