const rateLimit = require('express-rate-limit');
const { createRateLimitStore } = require('./redisRateLimitStore');

function decodeJwtUserId(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const segment = authHeader.slice(7).split('.')[1];
  if (!segment) return null;
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    return payload?.userId ?? null;
  } catch {
    return null;
  }
}

function rateLimitKey(req) {
  const userId = decodeJwtUserId(req.headers.authorization);
  if (userId) return `user:${userId}`;
  return req.ip;
}

const DEDICATED_LIMITER_PREFIXES = ['/auth', '/leaderboard', '/teams', '/display'];

function hasDedicatedLimiter(req) {
  const path = req.path || '';
  return DEDICATED_LIMITER_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildLimiter({ storePrefix, ...options }) {
  const store = createRateLimitStore(options.windowMs, storePrefix);
  return rateLimit({
    keyGenerator: rateLimitKey,
    ...options,
    ...(store ? { store, passOnStoreError: true } : {}),
  });
}

const rateLimitDisabled = process.env.RATE_LIMIT_ENABLED === 'false';
const isProduction = process.env.NODE_ENV === 'production';

function isLocalDevRequest(req) {
  const ip = req.ip || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

function shouldSkipApiLimiter(req) {
  if (rateLimitDisabled) return true;
  if (req.path === '/health' || req.path === '/health/live') return true;
  if (hasDedicatedLimiter(req)) return true;
  return !isProduction && isLocalDevRequest(req);
}

const authLimiter = buildLimiter({
  storePrefix: 'rl:auth:',
  windowMs: 15 * 60 * 1000,
  max: parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 100),
  skipSuccessfulRequests: true,
  message: { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = buildLimiter({
  storePrefix: 'rl:api:',
  windowMs: 1 * 60 * 1000,
  max: parsePositiveInt(process.env.API_RATE_LIMIT_MAX, isProduction ? 1200 : 2000),
  skip: shouldSkipApiLimiter,
  message: { error: 'Rate limit erreicht.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const leaderboardLimiter = buildLimiter({
  storePrefix: 'rl:leaderboard:',
  windowMs: 1 * 60 * 1000,
  max: parsePositiveInt(process.env.LEADERBOARD_RATE_LIMIT_MAX, 300),
  skip: () => rateLimitDisabled,
  message: { error: 'Zu viele Hitlisten-Anfragen. Bitte kurz warten.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const displayLimiter = buildLimiter({
  storePrefix: 'rl:display:',
  windowMs: 1 * 60 * 1000,
  max: parsePositiveInt(process.env.DISPLAY_RATE_LIMIT_MAX, 60),
  skip: () => rateLimitDisabled,
  message: { error: 'Display-Modus: Rate limit erreicht.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicReadLimiter = buildLimiter({
  storePrefix: 'rl:public:',
  windowMs: 1 * 60 * 1000,
  max: parsePositiveInt(process.env.PUBLIC_READ_RATE_LIMIT_MAX, 300),
  skip: () => rateLimitDisabled,
  message: { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  apiLimiter,
  leaderboardLimiter,
  displayLimiter,
  publicReadLimiter,
  decodeJwtUserId,
  shouldSkipApiLimiter,
};
