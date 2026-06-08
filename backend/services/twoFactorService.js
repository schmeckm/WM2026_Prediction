const speakeasy = require('speakeasy');
const { User } = require('../models');

function generateTotpSecret(email) {
  return speakeasy.generateSecret({
    name: `WM2026 (${email})`,
    length: 20,
  });
}

function verifyTotpCode(secret, token) {
  if (!secret || !token) return false;
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(token).replace(/\s/g, ''),
    window: 1,
  });
}

async function setupTwoFactor(userId) {
  const user = await User.findByPk(userId);
  if (!user) return null;
  const secret = generateTotpSecret(user.email);
  await user.update({ totpSecret: secret.base32, totpEnabled: false });
  return {
    otpauthUrl: secret.otpauth_url,
    secret: secret.base32,
  };
}

async function enableTwoFactor(userId, code) {
  const user = await User.findByPk(userId);
  if (!user?.totpSecret) return { error: 'not_setup' };
  if (!verifyTotpCode(user.totpSecret, code)) return { error: 'invalid_code' };
  await user.update({ totpEnabled: true });
  return { ok: true };
}

async function disableTwoFactor(userId, code) {
  const user = await User.findByPk(userId);
  if (!user?.totpEnabled || !user.totpSecret) return { error: 'not_enabled' };
  if (!verifyTotpCode(user.totpSecret, code)) return { error: 'invalid_code' };
  await user.update({ totpEnabled: false, totpSecret: null });
  return { ok: true };
}

async function verifyLoginTotp(user, code) {
  if (!user.totpEnabled) return true;
  return verifyTotpCode(user.totpSecret, code);
}

module.exports = {
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  verifyLoginTotp,
  verifyTotpCode,
};
