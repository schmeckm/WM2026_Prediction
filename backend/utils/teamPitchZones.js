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

function buildTeamPitchCardsForTeam(leaderboard, teamId, { currentUserId = null } = {}) {
  const normalizedTeamId = normalizeTeamId(teamId);
  if (!normalizedTeamId) {
    return { red: [], yellow: [], pitch: [] };
  }

  const members = leaderboard
    .filter((entry) => normalizeTeamId(entry.teamId) === normalizedTeamId)
    .map((entry) => ({
      userId: entry.userId,
      name: `${entry.firstName} ${entry.lastName}`.trim(),
      zone: classifyTeamPitchMember(entry),
      submittedPredictions: entry.submittedPredictions ?? 0,
      pastDueMatches: entry.pastDueMatches ?? 0,
      pastCompletionPercentage: entry.pastCompletionPercentage ?? 100,
      isCurrentUser: currentUserId != null && entry.userId === currentUserId,
    }));

  return {
    red: members.filter((m) => m.zone === 'red'),
    yellow: members.filter((m) => m.zone === 'yellow'),
    pitch: members.filter((m) => m.zone === 'pitch'),
  };
}

module.exports = {
  RED_CARD_THRESHOLD,
  YELLOW_CARD_THRESHOLD,
  normalizeTeamId,
  resolveUserTeamId,
  classifyTeamPitchMember,
  buildTeamPitchCardsForTeam,
};
