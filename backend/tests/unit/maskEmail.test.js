const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { maskEmail } = require('../../utils/maskEmail');

describe('maskEmail', () => {
  it('masks local part of email', () => {
    assert.equal(maskEmail('john.doe@example.com'), 'j***e@example.com');
  });

  it('handles short local parts', () => {
    assert.equal(maskEmail('ab@test.com'), 'ab@test.com');
  });

  it('returns empty for invalid input', () => {
    assert.equal(maskEmail(''), '');
    assert.equal(maskEmail(null), '');
  });
});
