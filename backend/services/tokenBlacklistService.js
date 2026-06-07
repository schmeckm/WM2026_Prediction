const crypto = require('crypto');
const { Op } = require('sequelize');
const { RevokedToken } = require('../models');

const memoryCache = new Map();
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function cacheToken(hash, expiresAtMs) {
  memoryCache.set(hash, expiresAtMs);
}

function cleanupMemoryCache() {
  const now = Date.now();
  for (const [hash, exp] of memoryCache.entries()) {
    if (now >= exp) memoryCache.delete(hash);
  }
}

async function cleanupExpiredTokens() {
  cleanupMemoryCache();
  await RevokedToken.destroy({
    where: { expiresAt: { [Op.lt]: new Date() } },
  });
}

async function blacklistToken(token, expiresAtMs) {
  if (!token) return;
  const expMs = expiresAtMs || Date.now() + 7 * 24 * 60 * 60 * 1000;
  const hash = tokenHash(token);
  cacheToken(hash, expMs);

  await RevokedToken.upsert({
    tokenHash: hash,
    expiresAt: new Date(expMs),
  });
}

async function isTokenBlacklisted(token) {
  if (!token) return false;
  cleanupMemoryCache();

  const hash = tokenHash(token);
  const cachedExp = memoryCache.get(hash);
  if (cachedExp) {
    if (Date.now() >= cachedExp) {
      memoryCache.delete(hash);
    } else {
      return true;
    }
  }

  const row = await RevokedToken.findOne({ where: { tokenHash: hash } });
  if (!row) return false;

  if (row.expiresAt.getTime() <= Date.now()) {
    await row.destroy();
    return false;
  }

  cacheToken(hash, row.expiresAt.getTime());
  return true;
}

setInterval(() => {
  cleanupExpiredTokens().catch(() => {});
}, CLEANUP_INTERVAL_MS).unref?.();

async function resetBlacklistForTests() {
  memoryCache.clear();
  try {
    await RevokedToken.destroy({ where: {}, truncate: true });
  } catch (error) {
    if (!/no such table|does not exist/i.test(error.message)) {
      throw error;
    }
  }
}

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
  cleanupExpiredTokens,
  resetBlacklistForTests,
};
