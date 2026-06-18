export const RED_CARD_THRESHOLD = 30;
export const YELLOW_CARD_THRESHOLD = 60;

export function classifyTeamPitchMember(member) {
  const tips = Number(member.submittedPredictions ?? 0);
  const pastDue = Number(member.pastDueMatches ?? 0);
  const pastCompletion = Number(member.pastCompletionPercentage ?? 100);

  if (tips === 0) return 'red';
  if (pastDue > 0 && pastCompletion < RED_CARD_THRESHOLD) return 'red';
  if (pastDue > 0 && pastCompletion < YELLOW_CARD_THRESHOLD) return 'yellow';
  return 'pitch';
}

export function summarizeTeamPitchZones(members) {
  const summary = { pitch: 0, yellow: 0, red: 0 };
  for (const member of members) {
    const zone = classifyTeamPitchMember(member);
    if (zone === 'red') summary.red += 1;
    else {
      summary.pitch += 1;
      if (zone === 'yellow') summary.yellow += 1;
    }
  }
  return summary;
}
