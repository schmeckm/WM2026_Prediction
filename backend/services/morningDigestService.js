const { Op } = require('sequelize');
const { User, Team, Match, Prediction, LeaderboardSnapshot } = require('../models');
const emailService = require('./emailService');
const { getAppUrl } = require('./authTokenService');
const { t, resolveUserEmailLocale, SUPPORTED_LOCALES } = require('./i18nService');
const { escapeHtml, wrapBrandedEmail } = require('./emailLayoutService');
const { getLeaderboard, getTeamRanking, getScoringRules } = require('./leaderboardService');
const { calculatePoints, classifyPrediction } = require('./pointsCalculationService');
const { formatMatchListHtml, formatMatchListText } = require('./reminderEmailService');
const { runWithConcurrency } = require('./emailQueueService');
const {
  toRecipientAuditEntry,
  loadUsersByIds,
  getMissingPredictionData,
  formatRankingListHtml,
} = require('./adminUserEmailService');
const { getReminderRecipients } = require('./reminderService');
const { getSetting, setSetting } = require('./settingsService');
const { isMorningDigestEnabled } = require('./emailReminderSettingsService');
const notificationService = require('./notificationService');
const { getLatestLeaderboardSummary } = require('./aiLeaderboardService');
const { checkAiAvailability } = require('./llmService');
const oddsApiService = require('./oddsApiService');
const { syncMarketOdds } = require('./oddsSyncService');
const { getScorers } = require('./footballCompetitionService');
const {
  buildTeamPitchCardsForTeam,
  buildTeamPitchCardsFromMembers,
  buildTeamPitchMembersIndex,
  filterLeaderboardEntriesForTeam,
  resolveUserTeamId,
} = require('../utils/teamPitchZones');

const TOP_PLAYERS = 5;
const TOP_TEAMS = 3;
const NIGHT_WINDOW_HOURS = 18;

function getDigestTimezone() {
  return process.env.REMINDER_TIMEZONE
    || process.env.DEFAULT_TIMEZONE
    || process.env.SENTRY_CRON_TIMEZONE
    || 'Europe/Zurich';
}

function getDateStringInTimezone(date, timezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
}

function formatResultLine(match) {
  return `${match.homeTeam} ${match.homeScore}:${match.awayScore} ${match.awayTeam}`;
}

function normalizeHttpUrl(url) {
  if (!url) return '';
  const str = String(url).trim();
  if (!str) return '';
  if (str.startsWith('http://') || str.startsWith('https://')) return str;
  return '';
}

function escapeHtmlAttr(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function formatFinishedMatchListHtml(matches, locale) {
  if (!matches.length) {
    return `<p style="margin:0;">${escapeHtml(t('emails.morningDigest.noLastNight', locale))}</p>`;
  }
  const linkLabel = t('emails.morningDigest.highlightsLabel', locale);
  const items = matches.map((m) => {
    const base = escapeHtml(formatResultLine(m));
    const url = normalizeHttpUrl(m.highlightsUrl);
    if (!url) return `<li>${base}</li>`;
    const href = escapeHtmlAttr(url);
    const label = escapeHtml(linkLabel);
    return `<li>${base} · <a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
  }).join('');
  return `<ul style="margin:12px 0;padding-left:20px;">${items}</ul>`;
}

function formatFinishedMatchListText(matches, locale) {
  if (!matches.length) return t('emails.morningDigest.noLastNight', locale);
  const label = t('emails.morningDigest.highlightsLabel', locale);
  return matches.map((m) => {
    const base = `- ${formatResultLine(m)}`;
    const url = normalizeHttpUrl(m.highlightsUrl);
    if (!url) return base;
    return `${base} (${label}: ${url})`;
  }).join('\n');
}

function formatRankDelta(rankDelta, locale) {
  if (!rankDelta || rankDelta === 0) {
    return t('emails.morningDigest.rankUnchanged', locale);
  }
  const places = Math.abs(rankDelta);
  if (rankDelta > 0) {
    const key = places === 1 ? 'emails.morningDigest.rankUpOne' : 'emails.morningDigest.rankUpMany';
    return t(key, locale, { places });
  }
  const key = places === 1 ? 'emails.morningDigest.rankDownOne' : 'emails.morningDigest.rankDownMany';
  return t(key, locale, { places });
}

function formatHighlightsHtml(highlights, locale) {
  if (!highlights.length) {
    return `<p style="margin:0;">${escapeHtml(t('emails.morningDigest.noHighlights', locale))}</p>`;
  }
  const items = highlights.map((h) => {
    const text = t(`emails.morningDigest.highlight.${h.key}`, locale, h.params);
    return `<li>${escapeHtml(text)}</li>`;
  }).join('');
  return `<ul style="margin:12px 0;padding-left:20px;">${items}</ul>`;
}

function formatHighlightsText(highlights, locale) {
  if (!highlights.length) return t('emails.morningDigest.noHighlights', locale);
  return highlights.map((h) => `- ${t(`emails.morningDigest.highlight.${h.key}`, locale, h.params)}`).join('\n');
}

function formatTopWmScorersHtml(scorers, locale) {
  if (!scorers?.length) {
    return `<p style="margin:0;">${escapeHtml(t('emails.morningDigest.noWmTopScorers', locale))}</p>`;
  }
  const items = scorers.map((entry) => {
    const line = t('emails.morningDigest.wmTopScorerLine', locale, {
      player: entry.player?.name || '–',
      team: entry.team?.name || '–',
      goals: entry.goals ?? 0,
    });
    return `<li>${escapeHtml(line)}</li>`;
  }).join('');
  return `<ol style="margin:12px 0;padding-left:20px;">${items}</ol>`;
}

function formatTopWmScorersText(scorers, locale) {
  if (!scorers?.length) return t('emails.morningDigest.noWmTopScorers', locale);
  return scorers.map((entry, idx) => {
    const line = t('emails.morningDigest.wmTopScorerLine', locale, {
      player: entry.player?.name || '–',
      team: entry.team?.name || '–',
      goals: entry.goals ?? 0,
    });
    return `${idx + 1}. ${line}`;
  }).join('\n');
}

function formatPitchMemberLine(member, locale) {
  const name = member.isCurrentUser
    ? `${member.name} ${t('emails.morningDigest.teamPitchYou', locale)}`
    : member.name;
  if (member.submittedPredictions === 0) {
    return t('emails.morningDigest.teamPitchNoTipsLine', locale, { name });
  }
  return t('emails.morningDigest.teamPitchCoverageLine', locale, {
    name,
    coverage: member.pastCompletionPercentage,
  });
}

function formatTeamPitchCardsHtml(cards, locale) {
  if (!cards || (cards.red.length === 0 && cards.yellow.length === 0)) {
    return `<p style="margin:0;">${escapeHtml(t('emails.morningDigest.teamPitchAllClear', locale))}</p>`;
  }

  const blocks = [];

  if (cards.yellow.length > 0) {
    const items = cards.yellow.map((m) => `<li>${escapeHtml(formatPitchMemberLine(m, locale))}</li>`).join('');
    blocks.push(`
      <p style="margin:0 0 4px;font-weight:600;">🟨 ${escapeHtml(t('emails.morningDigest.teamPitchYellowHeading', locale))}</p>
      <ul style="margin:0 0 12px;padding-left:20px;">${items}</ul>
    `.trim());
  }

  if (cards.red.length > 0) {
    const items = cards.red.map((m) => `<li>${escapeHtml(formatPitchMemberLine(m, locale))}</li>`).join('');
    blocks.push(`
      <p style="margin:0 0 4px;font-weight:600;">🟥 ${escapeHtml(t('emails.morningDigest.teamPitchRedHeading', locale))}</p>
      <ul style="margin:0;padding-left:20px;">${items}</ul>
    `.trim());
  }

  return blocks.join('');
}

function formatTeamPitchCardsText(cards, locale) {
  if (!cards || (cards.red.length === 0 && cards.yellow.length === 0)) {
    return t('emails.morningDigest.teamPitchAllClear', locale);
  }

  const lines = [];
  if (cards.yellow.length > 0) {
    lines.push(t('emails.morningDigest.teamPitchYellowHeading', locale));
    for (const member of cards.yellow) {
      lines.push(`- ${formatPitchMemberLine(member, locale)}`);
    }
  }
  if (cards.red.length > 0) {
    lines.push(t('emails.morningDigest.teamPitchRedHeading', locale));
    for (const member of cards.red) {
      lines.push(`- ${formatPitchMemberLine(member, locale)}`);
    }
  }
  return lines.join('\n');
}

function formatTeamPitchSummaryHtml(cards, locale) {
  const total = cards.red.length + cards.yellow.length + cards.pitch.length;
  return `<p style="margin:0 0 8px;font-size:14px;color:#cbd5e1;">${escapeHtml(t('emails.morningDigest.teamPitchSummary', locale, {
    total,
    pitch: cards.pitch.length,
    yellow: cards.yellow.length,
    red: cards.red.length,
  }))}</p>`;
}

function formatTeamPitchSummaryText(cards, locale) {
  const total = cards.red.length + cards.yellow.length + cards.pitch.length;
  return t('emails.morningDigest.teamPitchSummary', locale, {
    total,
    pitch: cards.pitch.length,
    yellow: cards.yellow.length,
    red: cards.red.length,
  });
}

function resolveTeamPitchForUser(user, shared, { previewFallback = false } = {}) {
  const teamId = resolveUserTeamId(user);
  const teamEntry = teamId
    ? shared.teamRanking.find((entry) => entry.teamId === teamId) || null
    : null;

  const resolveCards = (resolvedTeamId, teamName) => {
    const members = shared.teamPitchMembersByTeamId?.get(resolvedTeamId)
      || filterLeaderboardEntriesForTeam(
        shared.leaderboardForPitch || shared.leaderboard,
        resolvedTeamId,
        teamName,
      );
    return buildTeamPitchCardsFromMembers(members, { currentUserId: user.id });
  };

  if (teamId) {
    return {
      cards: resolveCards(teamId, teamEntry?.teamName),
      previewNote: null,
    };
  }

  if (!previewFallback || !shared.teamRanking?.length) {
    return { cards: null, previewNote: null };
  }

  const locale = resolveUserEmailLocale(user);
  let bestTeam = shared.teamRanking[0];
  let bestCards = resolveCards(bestTeam.teamId, bestTeam.teamName);
  let bestScore = bestCards.yellow.length + bestCards.red.length;

  for (const team of shared.teamRanking) {
    const cards = resolveCards(team.teamId, team.teamName);
    const score = cards.yellow.length + cards.red.length;
    if (score > bestScore) {
      bestScore = score;
      bestTeam = team;
      bestCards = cards;
    }
  }

  return {
    cards: bestCards,
    previewNote: t('emails.morningDigest.teamPitchPreviewSample', locale, {
      teamName: bestTeam.teamName,
    }),
  };
}

async function loadTopWmScorers() {
  try {
    const { top3 } = await getScorers({ limit: 3 });
    return top3 || [];
  } catch (error) {
    console.warn('[MorningDigest] WM top scorers not loaded:', error.message);
    return [];
  }
}

async function getYesterdayRanks() {
  const cutoff = new Date(Date.now() - 20 * 60 * 60 * 1000);
  const snapshotTime = await LeaderboardSnapshot.max('snapshotTime', {
    where: { snapshotTime: { [Op.lte]: cutoff } },
  });
  if (!snapshotTime) return {};

  const snapshots = await LeaderboardSnapshot.findAll({ where: { snapshotTime } });
  const map = {};
  for (const s of snapshots) {
    map[s.userId] = { rank: s.rank, totalPoints: s.totalPoints };
  }
  return map;
}

async function getLastNightMatches(timezone) {
  const now = new Date();
  const from = new Date(now.getTime() - NIGHT_WINDOW_HOURS * 60 * 60 * 1000);
  return Match.findAll({
    where: {
      status: 'finished',
      kickoffTime: { [Op.between]: [from, now] },
    },
    order: [['kickoffTime', 'ASC']],
  });
}

async function getTodayMatches(timezone) {
  const todayStr = getDateStringInTimezone(new Date(), timezone);
  const matches = await Match.findAll({
    where: {
      status: 'scheduled',
      kickoffTime: { [Op.gt]: new Date() },
      isManuallyLocked: false,
    },
    order: [['kickoffTime', 'ASC']],
    limit: 50,
  });
  return matches.filter((m) => getDateStringInTimezone(new Date(m.kickoffTime), timezone) === todayStr);
}

async function computePointsEarnedLastNight(matchIds) {
  if (matchIds.length === 0) return new Map();

  const scoringRules = await getScoringRules();
  const predictions = await Prediction.findAll({
    where: { matchId: { [Op.in]: matchIds } },
    include: [{ model: Match, as: 'match' }],
  });

  const earned = new Map();
  for (const prediction of predictions) {
    if (!prediction.match || prediction.match.status !== 'finished') continue;
    const points = calculatePoints(prediction, prediction.match, scoringRules) || 0;
    earned.set(prediction.userId, (earned.get(prediction.userId) || 0) + points);
  }
  return earned;
}

function buildRuleHighlights(lastNightMatches, predictions, scoringRules, usersById) {
  if (lastNightMatches.length === 0) return [];

  const matchIds = new Set(lastNightMatches.map((m) => m.id));
  const relevant = predictions.filter((p) => matchIds.has(p.matchId) && p.match?.status === 'finished');
  const highlights = [];

  const pointsByMatch = new Map();
  const exactByMatch = new Map();
  const exactByUser = new Map();
  const pointsByUser = new Map();

  for (const prediction of relevant) {
    const points = calculatePoints(prediction, prediction.match, scoringRules) || 0;
    const classification = classifyPrediction(prediction, prediction.match, scoringRules);

    pointsByMatch.set(prediction.matchId, (pointsByMatch.get(prediction.matchId) || 0) + points);
    pointsByUser.set(prediction.userId, (pointsByUser.get(prediction.userId) || 0) + points);

    if (classification === 'exact') {
      exactByMatch.set(prediction.matchId, (exactByMatch.get(prediction.matchId) || 0) + 1);
      exactByUser.set(prediction.userId, (exactByUser.get(prediction.userId) || 0) + 1);
    }
  }

  let topMatch = null;
  let topMatchPoints = -1;
  for (const match of lastNightMatches) {
    const total = pointsByMatch.get(match.id) || 0;
    if (total > topMatchPoints) {
      topMatchPoints = total;
      topMatch = match;
    }
  }
  if (topMatch) {
    highlights.push({
      key: 'matchOfNight',
      params: {
        homeTeam: topMatch.homeTeam,
        awayTeam: topMatch.awayTeam,
        homeScore: topMatch.homeScore,
        awayScore: topMatch.awayScore,
        totalPoints: topMatchPoints,
      },
    });
  }

  let topExactMatch = null;
  let topExactCount = 0;
  for (const match of lastNightMatches) {
    const count = exactByMatch.get(match.id) || 0;
    if (count > topExactCount) {
      topExactCount = count;
      topExactMatch = match;
    }
  }
  if (topExactMatch && topExactCount > 0) {
    highlights.push({
      key: 'mostExactTips',
      params: {
        count: topExactCount,
        homeTeam: topExactMatch.homeTeam,
        awayTeam: topExactMatch.awayTeam,
      },
    });
  }

  let topUserId = null;
  let topUserPoints = 0;
  for (const [userId, pts] of pointsByUser) {
    if (pts > topUserPoints) {
      topUserPoints = pts;
      topUserId = userId;
    }
  }
  if (topUserId && topUserPoints > 0) {
    const user = usersById.get(topUserId);
    const name = user ? `${user.firstName} ${user.lastName}`.trim() : t('emails.morningDigest.highlight.unknownPlayer', 'de');
    highlights.push({
      key: 'topScorer',
      params: { name, points: topUserPoints },
    });
  }

  let surpriseMatch = null;
  let lowestAvg = Infinity;
  for (const match of lastNightMatches) {
    const matchPreds = relevant.filter((p) => p.matchId === match.id);
    if (matchPreds.length === 0) continue;
    const total = pointsByMatch.get(match.id) || 0;
    const avg = total / matchPreds.length;
    if (avg < lowestAvg) {
      lowestAvg = avg;
      surpriseMatch = match;
    }
  }
  if (surpriseMatch && lowestAvg < 2) {
    highlights.push({
      key: 'surpriseResult',
      params: {
        homeTeam: surpriseMatch.homeTeam,
        awayTeam: surpriseMatch.awayTeam,
        homeScore: surpriseMatch.homeScore,
        awayScore: surpriseMatch.awayScore,
      },
    });
  }

  return highlights.slice(0, 3);
}

async function loadAiHighlightsByLocale() {
  const result = {};
  for (const locale of SUPPORTED_LOCALES) {
    const availability = checkAiAvailability('leaderboard_summary', locale);
    if (!availability.available) continue;
    try {
      const summary = await getLatestLeaderboardSummary(null, locale);
      if (summary?.content) {
        result[locale] = {
          content: summary.content,
          disclaimer: summary.disclaimer || '',
        };
      }
    } catch {
      // AI highlight is optional
    }
  }
  return result;
}

async function buildSharedDigestData() {
  const timezone = getDigestTimezone();
  const lastNightMatches = await getLastNightMatches(timezone);
  const todayMatches = await getTodayMatches(timezone);
  const leaderboard = await getLeaderboard();
  const leaderboardForPitch = await getLeaderboard({ includeAdmins: true });
  const teamRanking = await getTeamRanking();
  const yesterdayRanks = await getYesterdayRanks();
  const scoringRules = await getScoringRules();

  const matchIds = lastNightMatches.map((m) => m.id);
  const pointsEarned = await computePointsEarnedLastNight(matchIds);

  const predictions = matchIds.length > 0
    ? await Prediction.findAll({
      where: { matchId: { [Op.in]: matchIds } },
      include: [{ model: Match, as: 'match' }],
    })
    : [];

  const allUsers = await User.findAll({ attributes: ['id', 'firstName', 'lastName'] });
  const usersById = new Map(allUsers.map((u) => [u.id, u]));
  const ruleHighlights = buildRuleHighlights(lastNightMatches, predictions, scoringRules, usersById);
  const aiHighlights = await loadAiHighlightsByLocale();
  const topWmScorers = await loadTopWmScorers();
  const teamPitchMembersByTeamId = buildTeamPitchMembersIndex(leaderboardForPitch, teamRanking);

  return {
    timezone,
    lastNightMatches,
    todayMatches,
    leaderboard,
    leaderboardForPitch,
    teamRanking,
    teamPitchMembersByTeamId,
    yesterdayRanks,
    pointsEarned,
    topUsers: leaderboard.slice(0, TOP_PLAYERS),
    topTeams: teamRanking.slice(0, TOP_TEAMS),
    topWmScorers,
    ruleHighlights,
    aiHighlights,
  };
}

function buildUserDigestData(user, shared, { previewFallback = false } = {}) {
  const userEntry = shared.leaderboard.find((e) => e.userId === user.id) || null;
  const teamId = resolveUserTeamId(user);
  const teamEntry = teamId
    ? shared.teamRanking.find((e) => e.teamId === teamId) || null
    : null;

  const yesterday = shared.yesterdayRanks[user.id];
  const rankDelta = userEntry && yesterday ? yesterday.rank - userEntry.rank : 0;
  const pointsEarned = shared.pointsEarned.get(user.id) || 0;
  const pointsDelta = userEntry && yesterday
    ? userEntry.totalPoints - yesterday.totalPoints
    : pointsEarned;

  const teamPitch = resolveTeamPitchForUser(user, shared, { previewFallback });

  return {
    userEntry,
    teamEntry,
    rankDelta,
    pointsEarned,
    pointsDelta,
    teamPitchCards: teamPitch.cards,
    teamPitchPreviewNote: teamPitch.previewNote,
  };
}

function templateMorningDigest(user, shared, userData, { preview = false } = {}) {
  const locale = resolveUserEmailLocale(user);
  const link = `${getAppUrl()}/leaderboard`;
  const greeting = t('emails.morningDigest.greeting', locale, { firstName: user.firstName });

  let personalHtml = '';
  if (userData.userEntry) {
    personalHtml += `<p style="margin:0 0 8px;">${escapeHtml(t('emails.morningDigest.yourRank', locale, {
      rank: userData.userEntry.rank,
      points: userData.userEntry.totalPoints,
    }))}</p>`;
    if (userData.rankDelta !== 0 || userData.pointsEarned > 0) {
      personalHtml += `<p style="margin:0 0 12px;">${escapeHtml(formatRankDelta(userData.rankDelta, locale))}`;
      if (userData.pointsEarned > 0) {
        personalHtml += ` ${escapeHtml(t('emails.morningDigest.pointsEarned', locale, { points: userData.pointsEarned }))}`;
      }
      personalHtml += '</p>';
    }
  } else {
    personalHtml += `<p style="margin:0 0 12px;">${escapeHtml(t('emails.morningDigest.notRanked', locale))}</p>`;
  }

  if (userData.teamEntry) {
    personalHtml += `<p style="margin:0 0 12px;">${escapeHtml(t('emails.morningDigest.yourTeam', locale, {
      teamName: userData.teamEntry.teamName,
      rank: userData.teamEntry.rank,
      points: userData.teamEntry.averagePoints,
    }))}</p>`;
  } else if (user.team?.name) {
    personalHtml += `<p style="margin:0 0 12px;">${escapeHtml(t('emails.morningDigest.teamNotRanked', locale, {
      teamName: user.team.name,
    }))}</p>`;
  }

  let teamPitchHtml = '';
  let teamPitchText = '';
  if (userData.teamPitchCards) {
    const previewNoteHtml = userData.teamPitchPreviewNote
      ? `<p style="margin:0 0 8px;font-size:13px;color:#94a3b8;font-style:italic;">${escapeHtml(userData.teamPitchPreviewNote)}</p>`
      : '';
    teamPitchHtml = `
    <p style="margin:16px 0 8px;font-weight:600;">${escapeHtml(t('emails.morningDigest.teamPitchHeading', locale))}</p>
    ${previewNoteHtml}
    <p style="margin:0 0 8px;font-size:14px;color:#cbd5e1;">${escapeHtml(t('emails.morningDigest.teamPitchIntro', locale))}</p>
    ${formatTeamPitchSummaryHtml(userData.teamPitchCards, locale)}
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">${escapeHtml(t('emails.morningDigest.teamPitchListNote', locale))}</p>
    ${formatTeamPitchCardsHtml(userData.teamPitchCards, locale)}
  `.trim();
    teamPitchText = [
      t('emails.morningDigest.teamPitchHeading', locale),
      userData.teamPitchPreviewNote || null,
      t('emails.morningDigest.teamPitchIntro', locale),
      formatTeamPitchSummaryText(userData.teamPitchCards, locale),
      t('emails.morningDigest.teamPitchListNote', locale),
      formatTeamPitchCardsText(userData.teamPitchCards, locale),
    ].filter(Boolean).join('\n');
  }

  const lastNightHtml = formatFinishedMatchListHtml(shared.lastNightMatches, locale);
  const todayHtml = formatMatchListHtml(shared.todayMatches, locale, {
    timezone: shared.timezone,
    includeMarketOdds: true,
    bookmakerStyle: true,
  });
  const leaderboardHtml = formatRankingListHtml(
    shared.topUsers.map((entry) => ({
      rank: entry.rank,
      name: `${entry.firstName} ${entry.lastName}`,
      points: entry.totalPoints,
    })),
    locale,
  );
  const teamHtml = formatRankingListHtml(
    shared.topTeams.map((entry) => ({
      rank: entry.rank,
      name: entry.teamName,
      points: entry.averagePoints,
    })),
    locale,
    'name',
    'points',
  );

  const ruleHighlightsHtml = formatHighlightsHtml(shared.ruleHighlights, locale);
  const wmTopScorersHtml = formatTopWmScorersHtml(shared.topWmScorers, locale);
  const aiBlock = shared.aiHighlights[locale];
  let aiHtml = '';
  let aiText = '';
  if (aiBlock?.content) {
    aiHtml = `
      <p style="margin:0 0 8px;">${escapeHtml(aiBlock.content)}</p>
      ${aiBlock.disclaimer ? `<p style="margin:0;font-size:12px;color:#666;">${escapeHtml(aiBlock.disclaimer)}</p>` : ''}
    `.trim();
    aiText = `${aiBlock.content}${aiBlock.disclaimer ? `\n${aiBlock.disclaimer}` : ''}`;
  }

  const missingBlock = userData.missingCount > 0
    ? `
    <p style="margin:16px 0 8px;font-weight:600;">${escapeHtml(t('emails.morningDigest.missingTipsHeading', locale))}</p>
    <p style="margin:0 0 8px;">${escapeHtml(t('emails.morningDigest.missingTips', locale, { count: userData.missingCount }))}</p>
    ${formatMatchListHtml(userData.missingMatches || [], locale, {
      timezone: shared.timezone,
      includeMarketOdds: true,
      bookmakerStyle: true,
    })}
  `.trim()
    : '';

  const bodyHtml = `
    <p style="margin:0 0 16px;">${escapeHtml(t('emails.morningDigest.intro', locale))}</p>
    <p style="margin:0 0 8px;font-weight:600;">${escapeHtml(t('emails.morningDigest.lastNightHeading', locale))}</p>
    ${lastNightHtml}
    <p style="margin:16px 0 8px;font-weight:600;">${escapeHtml(t('emails.morningDigest.yourStandHeading', locale))}</p>
    ${personalHtml}
    ${teamPitchHtml}
    <p style="margin:16px 0 8px;font-weight:600;">${escapeHtml(t('emails.morningDigest.leaderboardHeading', locale))}</p>
    ${leaderboardHtml}
    <p style="margin:16px 0 8px;font-weight:600;">${escapeHtml(t('emails.morningDigest.teamHeading', locale))}</p>
    ${teamHtml}
    <p style="margin:16px 0 8px;font-weight:600;">${escapeHtml(t('emails.morningDigest.wmTopScorersHeading', locale))}</p>
    ${wmTopScorersHtml}
    <p style="margin:16px 0 8px;font-weight:600;">${escapeHtml(t('emails.morningDigest.highlightHeading', locale))}</p>
    ${ruleHighlightsHtml}
    ${aiHtml ? `<p style="margin:16px 0 8px;font-weight:600;">${escapeHtml(t('emails.morningDigest.aiHighlightHeading', locale))}</p>${aiHtml}` : ''}
    <p style="margin:16px 0 8px;font-weight:600;">${escapeHtml(t('emails.morningDigest.todayHeading', locale))}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#cbd5e1;">${escapeHtml(t('emails.morningDigest.bookmakerIntro', locale))}</p>
    ${todayHtml}
    ${missingBlock}
  `.trim();

  const lastNightText = formatFinishedMatchListText(shared.lastNightMatches, locale);
  const todayText = [
    t('emails.morningDigest.bookmakerIntro', locale),
    formatMatchListText(shared.todayMatches, locale, {
      timezone: shared.timezone,
      includeMarketOdds: true,
      bookmakerStyle: true,
    }),
  ].join('\n');
  const missingMatchListText = formatMatchListText(userData.missingMatches || [], locale, {
    timezone: shared.timezone,
    includeMarketOdds: true,
    bookmakerStyle: true,
  });
  const highlightsText = formatHighlightsText(shared.ruleHighlights, locale);
  const wmTopScorersText = formatTopWmScorersText(shared.topWmScorers, locale);

  return {
    subject: t('emails.morningDigest.subject', locale),
    html: wrapBrandedEmail({
      locale,
      title: t('emails.morningDigest.title', locale),
      greeting,
      bodyHtml,
      ctaHref: link,
      ctaLabel: t('emails.morningDigest.cta', locale),
    }),
    text: t('emails.morningDigest.text', locale, {
      firstName: user.firstName,
      lastNightText,
      rank: userData.userEntry?.rank ?? '–',
      points: userData.userEntry?.totalPoints ?? 0,
      rankDelta: formatRankDelta(userData.rankDelta, locale),
      pointsEarned: userData.pointsEarned,
      teamName: userData.teamEntry?.teamName ?? user.team?.name ?? '–',
      teamRank: userData.teamEntry?.rank ?? '–',
      teamPitchText: teamPitchText ? `\n${teamPitchText}\n` : '',
      wmTopScorersText,
      highlightsText,
      aiText,
      todayText,
      missingCount: userData.missingCount ?? 0,
      missingMatchListText,
      link,
    }),
    locale,
    preview,
  };
}

async function buildDigestForUser(user, shared, { previewFallback = false } = {}) {
  const base = buildUserDigestData(user, shared, { previewFallback });
  const { missingCount, missingMatches } = await getMissingPredictionData(user.id);
  return templateMorningDigest(user, shared, { ...base, missingCount, missingMatches });
}

async function previewMorningDigest(userId) {
  const users = await loadUsersByIds([userId]);
  if (users.length === 0) {
    return { error: 'User not found' };
  }
  const shared = await buildSharedDigestData();
  return buildDigestForUser(users[0], shared, { previewFallback: true });
}

async function shouldSendDigestToday(timezone, { force = false } = {}) {
  if (force) return true;
  const lastSent = await getSetting('lastDigestSentDate', null);
  const todayStr = getDateStringInTimezone(new Date(), timezone);
  return lastSent !== todayStr;
}

async function markDigestSentToday(timezone) {
  await setSetting('lastDigestSentDate', getDateStringInTimezone(new Date(), timezone));
}

async function sendMorningDigests({ force = false } = {}) {
  const enabled = force || await isMorningDigestEnabled();
  if (!enabled) {
    return { skipped: true, message: 'Morning Digest deaktiviert oder SMTP nicht bereit.' };
  }

  if (oddsApiService.isConfigured()) {
    try {
      await syncMarketOdds();
    } catch (error) {
      console.warn('[MorningDigest] Markt-Quoten vor Digest nicht aktualisiert:', error.message);
    }
  }

  const shared = await buildSharedDigestData();
  if (!(await shouldSendDigestToday(shared.timezone, { force }))) {
    return { skipped: true, message: 'Morning Digest wurde heute bereits gesendet.' };
  }

  const users = await getReminderRecipients();
  if (users.length === 0) {
    return { sent: 0, skipped: 0, recipients: [], message: 'Keine Empfänger gefunden.' };
  }

  const usersWithTeam = await User.findAll({
    where: { id: { [Op.in]: users.map((u) => u.id) } },
    include: [{ model: Team, as: 'team' }],
  });
  const userMap = new Map(usersWithTeam.map((u) => [u.id, u]));

  const recipientLog = [];

  await runWithConcurrency(users, async (user) => {
    const fullUser = userMap.get(user.id) || user;
    if (!fullUser.email) {
      recipientLog.push(toRecipientAuditEntry(fullUser, 'skipped', 'no_email'));
      return;
    }

    const template = await buildDigestForUser(fullUser, shared);
    await emailService.sendEmail({ to: fullUser.email, ...template });

    const locale = resolveUserEmailLocale(fullUser);
    await notificationService.createNotification({
      userId: fullUser.id,
      title: t('emails.morningDigest.notificationTitle', locale),
      message: t('emails.morningDigest.notificationBody', locale, {
        matchCount: shared.lastNightMatches.length,
      }),
      type: 'info',
      link: '/leaderboard',
    });

    recipientLog.push(toRecipientAuditEntry(fullUser, 'sent'));
  });

  const sent = recipientLog.filter((e) => e.status === 'sent').length;
  const skipped = recipientLog.filter((e) => e.status === 'skipped').length;

  if (sent > 0) {
    await markDigestSentToday(shared.timezone);
  }

  return {
    sent,
    skipped,
    recipients: recipientLog,
    message: `${sent} Morning Digest${sent === 1 ? '' : 's'} gesendet.`,
  };
}

async function sendMorningDigestsToUsers(userIds, { force = true } = {}) {
  const users = await loadUsersByIds(userIds);
  if (users.length === 0) {
    return { sent: 0, skipped: 0, recipients: [], message: 'Keine gültigen Empfänger ausgewählt.' };
  }

  if (oddsApiService.isConfigured()) {
    try {
      await syncMarketOdds();
    } catch (error) {
      console.warn('[MorningDigest] Markt-Quoten vor Digest nicht aktualisiert:', error.message);
    }
  }

  const shared = await buildSharedDigestData();
  let sent = 0;
  let skipped = 0;
  const recipients = [];

  for (const user of users) {
    if (!user.email) {
      skipped += 1;
      recipients.push(toRecipientAuditEntry(user, 'skipped', 'no_email'));
      continue;
    }
    const template = await buildDigestForUser(user, shared);
    await emailService.sendEmail({ to: user.email, ...template });
    sent += 1;
    recipients.push(toRecipientAuditEntry(user, 'sent'));
  }

  return {
    sent,
    skipped,
    recipients,
    message: sent > 0
      ? `${sent} Morning Digest${sent === 1 ? '' : 's'} gesendet.`
      : 'Keine E-Mails gesendet.',
  };
}

module.exports = {
  buildSharedDigestData,
  buildUserDigestData,
  templateMorningDigest,
  previewMorningDigest,
  sendMorningDigests,
  sendMorningDigestsToUsers,
  getDigestTimezone,
};
