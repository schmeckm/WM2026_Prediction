const RED_CARD_THRESHOLD = 30;
const YELLOW_CARD_THRESHOLD = 60;

function normalizeTeamId(teamId) {
  const id = Number(teamId);
  return Number.isFinite(id) ? id : null;
}

function resolveUserTeamId(user) {
  return normalizeTeamId(user?.teamId ?? user?.team?.id ?? null);
}

function classifyTeamPitchMember(member) {
  const tips = Number(member.submittedPredictions ?? 0);
  const pastDue = Number(member.pastDueMatches ?? 0);
  const pastCompletion = Number(member.pastCompletionPercentage ?? 100);

  if (tips === 0) return 'red';
  if (pastDue > 0 && pastCompletion < RED_CARD_THRESHOLD) return 'red';
  if (pastDue > 0 && pastCompletion < YELLOW_CARD_THRESHOLD) return 'yellow';
  return 'pitch';
}

function filterLeaderboardEntriesForTeam(leaderboard, teamId, teamName = null) {
  const normalizedTeamId = normalizeTeamId(teamId);
  const normalizedTeamName = teamName ? String(teamName).trim() : '';

  return leaderboard.filter((entry) => {
    if (normalizedTeamId && normalizeTeamId(entry.teamId) === normalizedTeamId) {
      return true;
    }
    if (normalizedTeamName && String(entry.teamName || '').trim() === normalizedTeamName) {
      return true;
    }
    return false;
  });
}

function buildTeamPitchCardsFromMembers(members, { currentUserId = null } = {}) {
  const mapped = members.map((entry) => ({
    userId: entry.userId,
    name: `${entry.firstName} ${entry.lastName}`.trim(),
    zone: classifyTeamPitchMember(entry),
    submittedPredictions: entry.submittedPredictions ?? 0,
    pastDueMatches: entry.pastDueMatches ?? 0,
    pastCompletionPercentage: entry.pastCompletionPercentage ?? 100,
    isCurrentUser: currentUserId != null && entry.userId === currentUserId,
  }));

  return {
    red: mapped.filter((m) => m.zone === 'red'),
    yellow: mapped.filter((m) => m.zone === 'yellow'),
    pitch: mapped.filter((m) => m.zone === 'pitch'),
  };
}

function buildTeamPitchCardsForTeam(leaderboard, teamId, { teamName = null, currentUserId = null } = {}) {
  const normalizedTeamId = normalizeTeamId(teamId);
  if (!normalizedTeamId && !teamName) {
    return { red: [], yellow: [], pitch: [] };
  }

  const members = filterLeaderboardEntriesForTeam(leaderboard, teamId, teamName);
  return buildTeamPitchCardsFromMembers(members, { currentUserId });
}

function buildTeamPitchMembersIndex(leaderboard, teamRanking = []) {
  const index = new Map();
  for (const team of teamRanking) {
    index.set(
      team.teamId,
      filterLeaderboardEntriesForTeam(leaderboard, team.teamId, team.teamName),
    );
  }
  return index;
}

module.exports = {
  RED_CARD_THRESHOLD,
  YELLOW_CARD_THRESHOLD,
  normalizeTeamId,
  resolveUserTeamId,
  classifyTeamPitchMember,
  filterLeaderboardEntriesForTeam,
  buildTeamPitchCardsFromMembers,
  buildTeamPitchCardsForTeam,
  buildTeamPitchMembersIndex,
};
