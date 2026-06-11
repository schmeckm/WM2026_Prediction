const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveUserEmailLocale } = require('../../services/i18nService');
const {
  templateManualTipReminder,
  templateStatusUpdate,
  toRecipientAuditEntry,
  buildMissingPredictionEmailData,
  filterMatchesWithinWindow,
} = require('../../services/adminUserEmailService');

describe('adminUserEmailService', () => {
  const userDe = { id: 1, firstName: 'Max', email: 'max@example.com', language: 'de', team: { name: 'Team A' } };
  const userNoLang = { firstName: 'Alex', email: 'alex@example.com', team: { name: 'Team B' } };

  it('falls back to English when user has no language', () => {
    assert.equal(resolveUserEmailLocale(userNoLang), 'en');
  });

  it('uses user language when set', () => {
    assert.equal(resolveUserEmailLocale(userDe), 'de');
  });

  it('builds branded manual tip reminder in user language', () => {
    const tpl = templateManualTipReminder(userDe, 2, [{
      homeTeam: 'Deutschland',
      awayTeam: 'Frankreich',
      kickoffTime: new Date('2026-06-15T18:00:00Z'),
    }]);
    assert.match(tpl.subject, /Erinnerung/i);
    assert.match(tpl.html, /Hallo Max!/);
    assert.match(tpl.html, /World Cup 2026/);
    assert.match(tpl.text, /2/);
  });

  it('builds audit recipient entries with email and status', () => {
    assert.deepEqual(toRecipientAuditEntry(userDe, 'sent'), {
      userId: userDe.id,
      email: 'max@example.com',
      name: 'Max',
      status: 'sent',
    });
    assert.deepEqual(toRecipientAuditEntry({ id: 9, firstName: 'No', lastName: 'Mail' }, 'skipped', 'no_email'), {
      userId: 9,
      email: null,
      name: 'No Mail',
      status: 'skipped',
      reason: 'no_email',
    });
  });

  it('builds branded status update with leaderboard sections', () => {
    const tpl = templateStatusUpdate(userNoLang, {
      userEntry: { rank: 3, totalPoints: 42 },
      topUsers: [{ rank: 1, firstName: 'A', lastName: 'B', totalPoints: 50 }],
      teamEntry: { rank: 2, teamName: 'Team B', averagePoints: 35 },
      topTeams: [{ rank: 1, teamName: 'Team X', averagePoints: 40 }],
    });
    assert.match(tpl.subject, /Current standings/i);
    assert.match(tpl.html, /Hello Alex!/);
    assert.match(tpl.html, /Top players/i);
    assert.match(tpl.html, /Top teams/i);
    assert.match(tpl.html, /World Cup 2026/);
  });

  it('counts and lists only missing matches within the reminder window', () => {
    const now = new Date('2026-06-10T10:00:00Z');
    const windowMs = 48 * 60 * 60 * 1000;
    const openMatches = [
      { id: 1, kickoffTime: new Date('2026-06-10T18:00:00Z') },
      { id: 2, kickoffTime: new Date('2026-06-11T18:00:00Z') },
      { id: 3, kickoffTime: new Date('2026-06-20T18:00:00Z') },
      { id: 4, kickoffTime: new Date('2026-06-10T20:00:00Z') },
    ];

    const relevant = filterMatchesWithinWindow(openMatches, windowMs, now);
    assert.equal(relevant.length, 3);

    const data = buildMissingPredictionEmailData(openMatches, new Set([2]), {
      windowMs,
      now,
      listLimit: 5,
    });

    assert.equal(data.missingCount, 2);
    assert.deepEqual(data.missingMatches.map((match) => match.id), [1, 4]);
  });
});
