const DEFAULT_BONUS_QUESTIONS = [
  {
    resolutionKey: 'champion',
    questionText: 'Wer wird Weltmeister?',
    questionType: 'national_team',
    points: 8,
  },
  {
    resolutionKey: 'runner_up',
    questionText: 'Wer wird Vize-Weltmeister?',
    questionType: 'national_team',
    points: 4,
  },
  {
    resolutionKey: 'third_place',
    questionText: 'Wer wird Dritter?',
    questionType: 'national_team',
    points: 2,
  },
  {
    resolutionKey: 'top_scorer',
    questionText: 'Wer wird Torschützenkönig?',
    questionType: 'national_team_player',
    points: 4,
  },
  {
    resolutionKey: 'team_progress',
    questionText: 'Wie weit kommt {team}?',
    questionType: 'favorite_team_progress',
    points: 2,
    optionsJson: JSON.stringify([
      'groupStage',
      'roundOf32',
      'roundOf16',
      'quarterFinal',
      'semiFinal',
      'final',
      'champion',
    ]),
  },
];

function getDefaultLockTime() {
  const start = process.env.TOURNAMENT_START || '2026-06-11';
  const kickoff = new Date(`${start}T19:00:00.000Z`);
  if (Number.isNaN(kickoff.getTime())) {
    return new Date('2026-06-11T20:00:00.000Z');
  }
  kickoff.setUTCHours(kickoff.getUTCHours() + 1);
  return kickoff;
}

module.exports = {
  DEFAULT_BONUS_QUESTIONS,
  getDefaultLockTime,
};
