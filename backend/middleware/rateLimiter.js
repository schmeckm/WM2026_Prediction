const rateLimit = require('express-rate-limit');
const { createRateLimitStore } = require('./redisRateLimitStore');

function buildLimiter(options) {
  const store = createRateLimitStore(options.windowMs);
  return rateLimit({
    ...options,
    ...(store ? { store, passOnStoreError: true } : {}),
  });
}

const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skipSuccessfulRequests: true,
  message: { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = buildLimiter({
  windowMs: 1 * 60 * 1000,
  max: 300,
  skip: (req) => req.path === '/health',
  message: { error: 'Rate limit erreicht.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const leaderboardLimiter = buildLimiter({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: 'Zu viele Hitlisten-Anfragen. Bitte kurz warten.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const displayLimiter = buildLimiter({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Display-Modus: Rate limit erreicht.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicReadLimiter = buildLimiter({
  windowMs: 1 * 60 * 1000,
  max: 120,
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
};
