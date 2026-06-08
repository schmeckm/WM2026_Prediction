const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildOfficialGroupFixtures,
  buildOfficialKnockoutFixtures,
} = require('../../services/wm2026ScheduleSeedService');

describe('wm2026ScheduleSeedService', () => {
  it('builds 72 group fixtures across groups A–L', () => {
    const fixtures = buildOfficialGroupFixtures();
    assert.equal(fixtures.length, 72);
    assert.equal(fixtures[0].groupName, 'A');
    assert.equal(fixtures[0].homeTeam, 'Mexiko');
    assert.equal(fixtures[5].groupName, 'A');
    assert.equal(fixtures[6].groupName, 'B');
    assert.equal(fixtures[71].groupName, 'L');
  });

  it('builds 32 knockout fixtures with official match numbers', () => {
    const fixtures = buildOfficialKnockoutFixtures();
    assert.equal(fixtures.length, 32);
    assert.equal(fixtures[0].matchNumber, 73);
    assert.equal(fixtures.at(-1).matchNumber, 104);
    assert.equal(fixtures[0].groupName, null);
  });
});
