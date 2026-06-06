const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveCityFromStadium,
  resolveVenueFromStadium,
  resolveVenueImageFromStadium,
  shouldReplaceCity,
  WM2026_VENUES,
} = require('../../data/wm2026Venues');

describe('wm2026Venues', () => {
  it('resolves FIFA WM 2026 stadiums to host cities', () => {
    assert.equal(resolveCityFromStadium('Estadio Akron'), 'Guadalajara');
    assert.equal(resolveCityFromStadium('SoFi Stadium'), 'Inglewood');
    assert.equal(resolveCityFromStadium('Reliant Stadium'), 'Houston');
    assert.equal(resolveCityFromStadium('MetLife Stadium'), 'East Rutherford');
    assert.equal(resolveCityFromStadium('Estadio Azteca'), 'Mexico City');
  });

  it('flags country-only values as replaceable cities', () => {
    assert.equal(shouldReplaceCity('SoFi Stadium', 'United States'), true);
    assert.equal(shouldReplaceCity('SoFi Stadium', 'Inglewood'), false);
  });

  it('resolves stadium images from Wikipedia venue data', () => {
    const sofi = resolveVenueFromStadium('SoFi Stadium');
    assert.equal(sofi.city, 'Inglewood');
    assert.match(sofi.imageUrl, /^https:\/\/upload\.wikimedia\.org\//);

    assert.match(resolveVenueImageFromStadium('MetLife Stadium'), /MetLife_Stadium/);
    assert.equal(resolveVenueImageFromStadium('Unknown Arena'), null);
  });

  it('provides images for all 16 WM 2026 venues', () => {
    assert.equal(WM2026_VENUES.length, 16);
    for (const venue of WM2026_VENUES) {
      assert.match(venue.imageUrl, /^https:\/\/upload\.wikimedia\.org\//, venue.stadium);
    }
  });
});
