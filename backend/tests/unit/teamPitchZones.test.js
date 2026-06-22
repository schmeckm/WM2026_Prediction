const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  classifyTeamPitchMember,
  buildTeamPitchCardsForTeam,
} = require('../../utils/teamPitchZones');

describe('teamPitchZones', () => {
  it('classifies members by prediction coverage', () => {
    assert.equal(classifyTeamPitchMember({ submittedPredictions: 0 }), 'red');
    assert.equal(classifyTeamPitchMember({
      submittedPredictions: 2,
      pastDueMatches: 10,
      pastCompletionPercentage: 20,
    }), 'red');
    assert.equal(classifyTeamPitchMember({
      submittedPredictions: 5,
      pastDueMatches: 10,
      pastCompletionPercentage: 45,
    }), 'yellow');
    assert.equal(classifyTeamPitchMember({
      submittedPredictions: 8,
      pastDueMatches: 10,
      pastCompletionPercentage: 80,
    }), 'pitch');
  });

  it('builds yellow and red lists for a team', () => {
    const leaderboard = [
      {
        userId: 1,
        teamId: 2,
        firstName: 'Max',
        lastName: 'M',
        submittedPredictions: 0,
        pastDueMatches: 5,
        pastCompletionPercentage: 0,
      },
      {
        userId: 3,
        teamId: 2,
        firstName: 'Anna',
        lastName: 'K',
        submittedPredictions: 4,
        pastDueMatches: 10,
        pastCompletionPercentage: 40,
      },
      {
        userId: 4,
        teamId: 2,
        firstName: 'Tom',
        lastName: 'T',
        submittedPredictions: 9,
        pastDueMatches: 10,
        pastCompletionPercentage: 90,
      },
      {
        userId: 5,
        teamId: 99,
        firstName: 'Other',
        lastName: 'Team',
        submittedPredictions: 0,
        pastDueMatches: 5,
        pastCompletionPercentage: 0,
      },
    ];

    const cards = buildTeamPitchCardsForTeam(leaderboard, 2, { currentUserId: 3 });
    assert.equal(cards.red.length, 1);
    assert.equal(cards.red[0].name, 'Max M');
    assert.equal(cards.yellow.length, 1);
    assert.equal(cards.yellow[0].name, 'Anna K');
    assert.equal(cards.yellow[0].isCurrentUser, true);
    assert.equal(cards.pitch.length, 1);
    assert.equal(cards.pitch[0].name, 'Tom T');
  });

  it('includes members matched by team name when teamId is missing', () => {
    const leaderboard = [
      {
        userId: 20,
        teamId: null,
        teamName: 'Team Intercompany',
        firstName: 'Naveen',
        lastName: 'Gopal',
        submittedPredictions: 1,
        pastDueMatches: 12,
        pastCompletionPercentage: 8,
      },
    ];
    const cards = buildTeamPitchCardsForTeam(leaderboard, 5, { teamName: 'Team Intercompany' });
    assert.equal(cards.red.length, 1);
    assert.equal(cards.red[0].name, 'Naveen Gopal');
  });
});
