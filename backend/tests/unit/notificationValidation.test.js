const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateNotificationPayload } = require('../../utils/notificationValidation');

describe('notificationValidation', () => {
  it('accepts portal and email delivery options', () => {
    const result = validateNotificationPayload({
      title: 'Update',
      message: 'Neue Punkte-Regeln',
      sendInApp: true,
      sendEmail: true,
      showOnLogin: true,
      includeAdmins: true,
      userId: 5,
      link: '/rules',
      type: 'warning',
    });

    assert.equal(result.valid, true);
    assert.equal(result.sanitized.sendInApp, true);
    assert.equal(result.sanitized.sendEmail, true);
    assert.equal(result.sanitized.showOnLogin, true);
    assert.equal(result.sanitized.includeAdmins, true);
    assert.equal(result.sanitized.userId, 5);
    assert.equal(result.sanitized.type, 'warning');
  });

  it('rejects when no delivery channel is selected', () => {
    const result = validateNotificationPayload({
      title: 'Update',
      message: 'Test',
      sendInApp: false,
      sendEmail: false,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.includes('delivery_channel'));
  });

  it('ignores showOnLogin when portal delivery is disabled', () => {
    const result = validateNotificationPayload({
      title: 'Update',
      message: 'Test',
      sendInApp: false,
      sendEmail: true,
      showOnLogin: true,
    });

    assert.equal(result.valid, true);
    assert.equal(result.sanitized.showOnLogin, false);
  });
});
