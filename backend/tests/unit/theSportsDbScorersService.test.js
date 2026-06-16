const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseGoalScorerName,
  parseGoalDetails,
  aggregateFromEvents,
} = require('../../services/theSportsDbScorersService');

describe('theSportsDbScorersService', () => {
  it('parses player names from goal detail strings', () => {
    assert.equal(parseGoalScorerName("Lionel Messi 23'"), 'Lionel Messi');
    assert.equal(parseGoalScorerName("Kylian Mbappé 90+2' (pen)"), 'Kylian Mbappé');
  });

  it('aggregates goals per player and team from events', () => {
    const ranking = aggregateFromEvents([
      {
        strHomeTeam: 'Argentina',
        strAwayTeam: 'France',
        strHomeGoalDetails: "Lionel Messi 23'; Lionel Messi 78'",
        strAwayGoalDetails: "Kylian Mbappé 57'",
      },
      {
        strHomeTeam: 'Argentina',
        strAwayTeam: 'Croatia',
        strHomeGoalDetails: "Julian Alvarez 39'; Lionel Messi 69'",
        strAwayGoalDetails: null,
      },
    ]);

    assert.equal(ranking[0].playerName, 'Lionel Messi');
    assert.equal(ranking[0].teamName, 'Argentina');
    assert.equal(ranking[0].goals, 3);
    assert.equal(ranking[1].goals, 1);
  });
});
