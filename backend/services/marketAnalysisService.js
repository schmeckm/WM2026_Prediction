const { Op } = require('sequelize');
const { Match } = require('../models');
const { parseMarketOddsJson } = require('../utils/matchMarketOdds');

function getKickoffMarketOdds(match) {
  return parseMarketOddsJson(match.marketOddsAtKickoffJson)
    || parseMarketOddsJson(match.marketOddsJson);
}

function getMarketFavorite(probs, homeTeam, awayTeam) {
  const { home, draw, away } = probs;
  const max = Math.max(home, draw, away);
  if (max === home) return { type: 'home', team: homeTeam, probability: home };
  if (max === away) return { type: 'away', team: awayTeam, probability: away };
  return { type: 'draw', team: null, probability: draw };
}

function getActualOutcome(match) {
  if (match.status !== 'finished') return null;
  if (match.homeScore == null || match.awayScore == null) return null;
  if (match.homeScore > match.awayScore) return 'home';
  if (match.homeScore < match.awayScore) return 'away';
  return 'draw';
}

function analyzeMatch(match) {
  const odds = getKickoffMarketOdds(match);
  if (!odds?.probabilities) return null;

  const probs = odds.probabilities;
  const favorite = getMarketFavorite(probs, match.homeTeam, match.awayTeam);
  const actual = getActualOutcome(match);

  return {
    matchId: match.id,
    matchNumber: match.matchNumber,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    groupName: match.groupName || null,
    stage: match.stage || null,
    kickoffTime: match.kickoffTime,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    bookmaker: odds.bookmaker || null,
    fetchedAt: odds.fetchedAt || null,
    probabilities: probs,
    marketFavorite: favorite,
    actualOutcome: actual,
    marketCorrect: actual == null ? null : favorite.type === actual,
    homeMarketWinPct: probs.home,
    drawMarketPct: probs.draw,
    awayMarketWinPct: probs.away,
  };
}

function buildTeamStats(teamName, matchAnalyses) {
  const relevant = matchAnalyses.filter(
    (entry) => entry && (entry.homeTeam === teamName || entry.awayTeam === teamName),
  );

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let marketWinPctSum = 0;
  let marketWinPctCount = 0;
  let timesMarketFavorite = 0;
  let marketFavoriteCorrect = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const entry of relevant) {
    const isHome = entry.homeTeam === teamName;
    const teamScore = isHome ? entry.homeScore : entry.awayScore;
    const oppScore = isHome ? entry.awayScore : entry.homeScore;

    if (entry.status === 'finished' && teamScore != null && oppScore != null) {
      goalsFor += teamScore;
      goalsAgainst += oppScore;
      if (teamScore > oppScore) wins += 1;
      else if (teamScore === oppScore) draws += 1;
      else losses += 1;

      marketWinPctSum += isHome ? entry.homeMarketWinPct : entry.awayMarketWinPct;
      marketWinPctCount += 1;

      if (entry.marketFavorite?.team === teamName) {
        timesMarketFavorite += 1;
        if (entry.marketCorrect) marketFavoriteCorrect += 1;
      }
    }
  }

  const played = wins + draws + losses;
  return {
    team: teamName,
    matchesWithOdds: relevant.length,
    matchesFinished: played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    actualWinPct: played ? +(wins / played * 100).toFixed(1) : null,
    avgMarketWinPct: marketWinPctCount ? +(marketWinPctSum / marketWinPctCount).toFixed(1) : null,
    timesMarketFavorite,
    marketFavoriteCorrect,
    marketFavoriteAccuracyPct: timesMarketFavorite
      ? +(marketFavoriteCorrect / timesMarketFavorite * 100).toFixed(1)
      : null,
  };
}

function buildGroupRanking(matchAnalyses) {
  const groupMap = new Map();
  for (const entry of matchAnalyses) {
    if (!entry.groupName || entry.status !== 'finished' || entry.marketCorrect == null) continue;
    if (!groupMap.has(entry.groupName)) {
      groupMap.set(entry.groupName, { groupName: entry.groupName, correct: 0, total: 0 });
    }
    const group = groupMap.get(entry.groupName);
    group.total += 1;
    if (entry.marketCorrect) group.correct += 1;
  }

  return [...groupMap.values()]
    .map((group) => ({
      ...group,
      accuracyPct: group.total ? +(group.correct / group.total * 100).toFixed(1) : null,
    }))
    .sort((a, b) => (b.accuracyPct || 0) - (a.accuracyPct || 0) || b.total - a.total);
}

async function getMarketAnalysis({ team = null, groupName = null } = {}) {
  const matches = await Match.findAll({
    where: {
      [Op.or]: [
        { marketOddsAtKickoffJson: { [Op.not]: null } },
        { marketOddsJson: { [Op.not]: null } },
      ],
    },
    order: [['kickoffTime', 'ASC']],
  });

  let analyses = matches.map((match) => analyzeMatch(match)).filter(Boolean);
  if (groupName) {
    analyses = analyses.filter((entry) => entry.groupName === groupName);
  }

  const teamNames = new Set();
  analyses.forEach((entry) => {
    teamNames.add(entry.homeTeam);
    teamNames.add(entry.awayTeam);
  });

  let teams = [...teamNames].sort((a, b) => a.localeCompare(b)).map(
    (name) => buildTeamStats(name, analyses),
  );

  if (team) {
    teams = teams.filter((entry) => entry.team === team);
    analyses = analyses.filter(
      (entry) => entry.homeTeam === team || entry.awayTeam === team,
    );
  }

  const finishedAnalyses = analyses.filter((entry) => entry.status === 'finished');
  const marketFavoriteTotal = finishedAnalyses.filter((entry) => entry.marketCorrect != null).length;
  const marketFavoriteCorrect = finishedAnalyses.filter((entry) => entry.marketCorrect).length;

  return {
    teams,
    matches: analyses,
    timeline: analyses,
    groupRanking: buildGroupRanking(analyses),
    summary: {
      totalMatchesWithOdds: analyses.length,
      finishedMatches: finishedAnalyses.length,
      marketFavoriteCorrect,
      marketFavoriteTotal,
      overallMarketAccuracyPct: marketFavoriteTotal
        ? +(marketFavoriteCorrect / marketFavoriteTotal * 100).toFixed(1)
        : null,
    },
  };
}

function escapeCsv(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function buildMarketAnalysisCsv(data) {
  const lines = [];
  lines.push('Team,Finished,AvgMarketWinPct,ActualWinPct,GoalsFor,GoalsAgainst,TimesFavorite,FavoriteCorrectPct');
  for (const team of data.teams) {
    lines.push([
      escapeCsv(team.team),
      team.matchesFinished,
      team.avgMarketWinPct ?? '',
      team.actualWinPct ?? '',
      team.goalsFor,
      team.goalsAgainst,
      team.timesMarketFavorite,
      team.marketFavoriteAccuracyPct ?? '',
    ].join(','));
  }
  lines.push('');
  lines.push('Match,Group,Kickoff,Home,Away,Score,HomeMarketPct,DrawPct,AwayMarketPct,Favorite,MarketCorrect');
  for (const match of data.matches) {
    const score = match.status === 'finished' && match.homeScore != null
      ? `${match.homeScore}:${match.awayScore}`
      : '';
    lines.push([
      escapeCsv(match.matchNumber),
      escapeCsv(match.groupName),
      escapeCsv(match.kickoffTime),
      escapeCsv(match.homeTeam),
      escapeCsv(match.awayTeam),
      score,
      match.homeMarketWinPct,
      match.drawMarketPct,
      match.awayMarketWinPct,
      escapeCsv(match.marketFavorite?.team || 'Draw'),
      match.marketCorrect == null ? '' : (match.marketCorrect ? 'yes' : 'no'),
    ].join(','));
  }
  lines.push('');
  lines.push('Group,Correct,Total,AccuracyPct');
  for (const group of data.groupRanking) {
    lines.push([
      escapeCsv(group.groupName),
      group.correct,
      group.total,
      group.accuracyPct ?? '',
    ].join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function backfillKickoffMarketOdds() {
  const matches = await Match.findAll({
    where: {
      marketOddsAtKickoffJson: null,
      marketOddsJson: { [Op.not]: null },
    },
  });

  let updated = 0;
  for (const match of matches) {
    await match.update({ marketOddsAtKickoffJson: match.marketOddsJson });
    updated += 1;
  }
  return { updated };
}

module.exports = {
  getKickoffMarketOdds,
  analyzeMatch,
  getMarketAnalysis,
  buildMarketAnalysisCsv,
  backfillKickoffMarketOdds,
};
