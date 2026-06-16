const { Match } = require('../models');
const { teamsMatch } = require('../data/wm2026ScheduleLookup');
const { normalizeProgressOption } = require('../utils/bonusProgressOptions');
const { findTeamByName, getTeamById } = require('./footballTeamService');
const { getScorers } = require('./footballCompetitionService');

const PROGRESS_RANK = {
  groupStage: 0,
  roundOf32: 1,
  roundOf16: 2,
  quarterFinal: 3,
  semiFinal: 4,
  final: 5,
  champion: 6,
};

function isFinishedMatch(match) {
  return match.status === 'finished'
    && match.homeScore != null
    && match.awayScore != null;
}

function getMatchWinner(match) {
  if (!isFinishedMatch(match)) return null;
  if (match.homeScore > match.awayScore) return match.homeTeam;
  if (match.awayScore > match.homeScore) return match.awayTeam;
  return null;
}

function getMatchLoser(match) {
  if (!isFinishedMatch(match)) return null;
  if (match.homeScore > match.awayScore) return match.awayTeam;
  if (match.awayScore > match.homeScore) return match.homeTeam;
  return null;
}

function classifyMatchStage(stage) {
  const normalized = String(stage || '').toLowerCase().replace(/-/g, ' ');
  if (normalized.includes('third')) return 'third_place';
  if (normalized.includes('semi')) return 'semi_final';
  if (normalized.includes('quarter')) return 'quarter_final';
  if (normalized === 'final' || (normalized.includes('final') && !normalized.includes('quarter') && !normalized.includes('semi'))) {
    return 'final';
  }
  if (normalized.includes('last 32') || normalized.includes('last_32')) {
    return 'last_32';
  }
  if (normalized.includes('16')) {
    return 'round_of_16';
  }
  if (normalized.includes('group')) return 'group';
  return 'other';
}

function stageToProgress(stageType, { isWinner = false } = {}) {
  switch (stageType) {
    case 'group': return 'groupStage';
    case 'last_32': return 'roundOf32';
    case 'round_of_16': return 'roundOf16';
    case 'quarter_final': return 'quarterFinal';
    case 'semi_final': return 'semiFinal';
    case 'third_place': return 'semiFinal';
    case 'final': return isWinner ? 'champion' : 'final';
    default: return null;
  }
}

async function toApiTeam(teamName) {
  if (!teamName) return null;
  try {
    const apiTeam = await findTeamByName(teamName);
    if (apiTeam) {
      return { id: apiTeam.id, name: apiTeam.name };
    }
  } catch {
    // API optional
  }
  return { id: null, name: teamName };
}

async function toApiPlayer(playerName, teamName = null) {
  if (!playerName) return null;
  try {
    const { listPlayers } = require('./footballTeamService');
    const players = await listPlayers(playerName);
    const exact = players.find((player) => (
      player.name.toLowerCase() === playerName.toLowerCase()
      && (!teamName || teamsMatch(player.teamName, teamName))
    ));
    if (exact) {
      return { id: exact.id, name: exact.name, teamName: exact.teamName };
    }
    const partial = players.find((player) => player.name.toLowerCase().includes(playerName.toLowerCase()));
    if (partial) {
      return { id: partial.id, name: partial.name, teamName: partial.teamName };
    }
  } catch {
    // API optional
  }
  return { id: null, name: playerName, teamName };
}

async function findFinishedMatchByStage(stageType) {
  const matches = await Match.findAll({
    where: { status: 'finished' },
    order: [['kickoffTime', 'DESC']],
  });

  return matches.find((match) => classifyMatchStage(match.stage) === stageType && isFinishedMatch(match)) || null;
}

async function getPodiumFromMatches() {
  const finalMatch = await findFinishedMatchByStage('final');
  const thirdPlaceMatch = await findFinishedMatchByStage('third_place');

  const championName = finalMatch ? getMatchWinner(finalMatch) : null;
  const runnerUpName = finalMatch ? getMatchLoser(finalMatch) : null;
  const thirdPlaceName = thirdPlaceMatch ? getMatchWinner(thirdPlaceMatch) : null;

  return {
    champion: championName ? await toApiTeam(championName) : null,
    runnerUp: runnerUpName ? await toApiTeam(runnerUpName) : null,
    thirdPlace: thirdPlaceName ? await toApiTeam(thirdPlaceName) : null,
    sources: {
      finalMatchId: finalMatch?.id || null,
      thirdPlaceMatchId: thirdPlaceMatch?.id || null,
    },
    available: {
      champion: !!championName,
      runnerUp: !!runnerUpName,
      thirdPlace: !!thirdPlaceName,
    },
  };
}

async function getTopScorerSuggestion() {
  try {
    const { scorers, source } = await getScorers({ limit: 10 });
    const leader = scorers[0];
    if (!leader?.player?.name) {
      return { topScorer: null, available: false, source: 'api_empty' };
    }

    const topScorer = await toApiPlayer(leader.player.name, leader.team?.name || null);
    return {
      topScorer: {
        ...topScorer,
        goals: leader.goals ?? null,
      },
      available: true,
      source: source === 'football-data' ? 'football_api' : source,
    };
  } catch {
    return { topScorer: null, available: false, source: 'api_error' };
  }
}

async function getTournamentOutcomes() {
  const podium = await getPodiumFromMatches();
  const scorer = await getTopScorerSuggestion();

  return {
    ...podium,
    topScorer: scorer.topScorer,
    topScorerAvailable: scorer.available,
    topScorerSource: scorer.source,
  };
}

function teamPlayedInMatch(teamName, match) {
  return teamsMatch(teamName, match.homeTeam) || teamsMatch(teamName, match.awayTeam);
}

function teamWonMatch(teamName, match) {
  const winner = getMatchWinner(match);
  return winner ? teamsMatch(teamName, winner) : false;
}

async function resolveFavoriteTeamName(user) {
  if (!user) return null;
  if (user.favoriteNationalTeamName) return user.favoriteNationalTeamName;
  if (!user.favoriteNationalTeamId) return null;

  try {
    const team = await getTeamById(user.favoriteNationalTeamId);
    return team?.name || null;
  } catch {
    return null;
  }
}

async function getTeamProgress(teamName) {
  if (!teamName) return null;

  const matches = await Match.findAll({
    where: { status: 'finished' },
    order: [['kickoffTime', 'ASC']],
  });

  const teamMatches = matches.filter((match) => teamPlayedInMatch(teamName, match));
  if (!teamMatches.length) return null;

  let best = 'groupStage';
  let bestRank = PROGRESS_RANK.groupStage;

  for (const match of teamMatches) {
    const stageType = classifyMatchStage(match.stage);
    const progress = stageToProgress(stageType, { isWinner: teamWonMatch(teamName, match) });
    if (!progress) continue;

    const rank = PROGRESS_RANK[progress];
    if (rank > bestRank) {
      best = progress;
      bestRank = rank;
    }
  }

  return best;
}

function inferResolutionKey(question) {
  if (question.resolutionKey) return question.resolutionKey;

  const text = String(question.questionText || '').toLowerCase();
  if (text.includes('torschützen') || text.includes('torjaeger') || text.includes('torjäger')) {
    return 'top_scorer';
  }
  if (text.includes('vize')) return 'runner_up';
  if (text.includes('dritter') || text.includes('platz 3') || text.includes('3. platz')) {
    return 'third_place';
  }
  if (text.includes('weltmeister') || text.includes('champion')) return 'champion';
  if (text.includes('wie weit') || question.questionType === 'favorite_team_progress') {
    return 'team_progress';
  }
  return null;
}

async function suggestAnswerForQuestion(question) {
  const key = inferResolutionKey(question);
  const outcomes = await getTournamentOutcomes();

  switch (key) {
    case 'champion':
      return {
        resolutionKey: key,
        available: outcomes.available.champion,
        correctAnswer: outcomes.champion,
        source: outcomes.sources.finalMatchId ? `match:${outcomes.sources.finalMatchId}` : null,
      };
    case 'runner_up':
      return {
        resolutionKey: key,
        available: outcomes.available.runnerUp,
        correctAnswer: outcomes.runnerUp,
        source: outcomes.sources.finalMatchId ? `match:${outcomes.sources.finalMatchId}` : null,
      };
    case 'third_place':
      return {
        resolutionKey: key,
        available: outcomes.available.thirdPlace,
        correctAnswer: outcomes.thirdPlace,
        source: outcomes.sources.thirdPlaceMatchId ? `match:${outcomes.sources.thirdPlaceMatchId}` : null,
      };
    case 'top_scorer':
      return {
        resolutionKey: key,
        available: outcomes.topScorerAvailable,
        correctAnswer: outcomes.topScorer,
        source: outcomes.topScorerSource,
      };
    case 'team_progress':
      return {
        resolutionKey: key,
        available: true,
        correctAnswer: null,
        source: 'per_user_team_progress',
        hint: 'Wird pro Nutzer anhand des Lieblingsteams ausgewertet.',
      };
    default:
      return {
        resolutionKey: key || null,
        available: false,
        correctAnswer: null,
        source: null,
      };
  }
}

function isProgressAnswerCorrect(answer, actualProgress) {
  const normalizedAnswer = normalizeProgressOption(answer);
  const normalizedActual = normalizeProgressOption(actualProgress);
  return !!(normalizedAnswer && normalizedActual && normalizedAnswer === normalizedActual);
}

module.exports = {
  classifyMatchStage,
  getTournamentOutcomes,
  getPodiumFromMatches,
  getTopScorerSuggestion,
  getTeamProgress,
  inferResolutionKey,
  resolveFavoriteTeamName,
  suggestAnswerForQuestion,
  isProgressAnswerCorrect,
  toApiTeam,
  toApiPlayer,
};
