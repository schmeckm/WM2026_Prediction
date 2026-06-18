const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildAnnouncementEmail } = require('../../services/adminAnnouncementService');

describe('adminAnnouncementService', () => {
  it('builds branded announcement email with optional link CTA', () => {
    const template = buildAnnouncementEmail(
      { firstName: 'Max', language: 'de' },
      {
        title: 'Wichtiges Update',
        message: 'Die Punkte wurden angepasst.',
        link: '/rules',
      },
    );

    assert.match(template.subject, /Wichtiges Update/);
    assert.match(template.html, /Wichtiges Update/);
    assert.match(template.html, /Die Punkte wurden angepasst\./);
    assert.match(template.html, /\/rules/);
    assert.match(template.text, /Max/);
  });
});
