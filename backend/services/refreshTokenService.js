const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { RefreshToken, User, Team } = require('../models');

const REFRESH_TTL_MS = parseInt(process.env.REFRESH_TOKEN_TTL_MS || String(30 * 24 * 60 * 60 * 1000), 10);

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function issueAccessToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
  );
}

async function createRefreshToken(userId) {
  const raw = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await RefreshToken.create({ tokenHash, userId, expiresAt });

  return { token: raw, expiresAt };
}

async function issueTokenPair(user) {
  const accessToken = issueAccessToken(user);
  const refresh = await createRefreshToken(user.id);
  return {
    token: accessToken,
    refreshToken: refresh.token,
    refreshExpiresAt: refresh.expiresAt,
  };
}

async function rotateRefreshToken(rawToken) {
  if (!rawToken) return { error: 'invalid' };

  const tokenHash = hashToken(rawToken);
  const row = await RefreshToken.findOne({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!row) return { error: 'invalid' };

  await row.update({ revokedAt: new Date() });

  const user = await User.findByPk(row.userId, {
    include: [{ model: Team, as: 'team' }],
  });
  if (!user) return { error: 'invalid' };

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { tokenHash, revokedAt: null } },
  );
}

async function revokeAllRefreshTokensForUser(userId) {
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } },
  );
}

async function cleanupExpiredRefreshTokens() {
  await RefreshToken.destroy({
    where: {
      [Op.or]: [
        { expiresAt: { [Op.lt]: new Date() } },
        { revokedAt: { [Op.ne]: null } },
      ],
    },
  });
}

setInterval(() => {
  cleanupExpiredRefreshTokens().catch(() => {});
}, 60 * 60 * 1000).unref?.();

async function resetRefreshTokensForTests() {
  try {
    await RefreshToken.destroy({ where: {}, truncate: true });
  } catch (error) {
    if (!/no such table|does not exist/i.test(error.message)) throw error;
  }
}

module.exports = {
  issueAccessToken,
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  cleanupExpiredRefreshTokens,
  resetRefreshTokensForTests,
};
