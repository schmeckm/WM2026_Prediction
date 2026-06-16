const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  formatBookmakerProbabilitiesLine,
  formatBookmakerFavoriteLine,
} = require('../../utils/marketOddsFormat');

describe('marketOddsFormat', () => {
  const match = {
    homeTeam: 'Deutschland',
    awayTeam: 'USA',
    marketOddsJson: JSON.stringify({
      probabilities: { home: 52.3, draw: 24.1, away: 23.6 },
    }),
  };

  it('formats bookmaker probabilities in user locale', () => {
    const line = formatBookmakerProbabilitiesLine(match, 'de');
    assert.match(line, /Buchmacher: Deutschland 52\.3%/);
  });

  it('formats bookmaker favorite in user locale', () => {
    const line = formatBookmakerFavoriteLine(match, 'en');
    assert.equal(line, 'Favorite: Deutschland (52.3%)');
  });

  it('formats draw favorite when draw is highest', () => {
    const drawMatch = {
      ...match,
      marketOddsJson: JSON.stringify({
        probabilities: { home: 30, draw: 40, away: 30 },
      }),
    };
    const line = formatBookmakerFavoriteLine(drawMatch, 'de');
    assert.equal(line, 'Favorit: Unentschieden (40.0%)');
  });
});
