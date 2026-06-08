const { redisGet, redisSet, redisDel, ensureRedis } = require('../services/redisClient');

class RedisRateLimitStore {
  constructor(prefix = 'rl:', windowMs = 60_000) {
    this.prefix = prefix;
    this.windowMs = windowMs;
    this.localFallback = new Map();
  }

  async increment(key) {
    const fullKey = `${this.prefix}${key}`;
    const now = Date.now();

    if (await ensureRedis()) {
      try {
        const raw = await redisGet(fullKey);
        let entry = raw
          ? JSON.parse(raw)
          : { totalHits: 0, resetTime: now + this.windowMs };
        entry.totalHits += 1;
        if (!raw) entry.resetTime = now + this.windowMs;
        await redisSet(fullKey, JSON.stringify(entry), this.windowMs);
        return {
          totalHits: entry.totalHits,
          resetTime: new Date(entry.resetTime),
        };
      } catch {
        // fall through to memory
      }
    }

    let entry = this.localFallback.get(fullKey);
    if (!entry || now > entry.resetTime.getTime()) {
      entry = { totalHits: 0, resetTime: new Date(now + this.windowMs) };
    }
    entry.totalHits += 1;
    this.localFallback.set(fullKey, entry);
    return entry;
  }

  async decrement(key) {
    const fullKey = `${this.prefix}${key}`;
    if (await ensureRedis()) {
      try {
        const raw = await redisGet(fullKey);
        if (raw) {
          const entry = JSON.parse(raw);
          entry.totalHits = Math.max(0, entry.totalHits - 1);
          await redisSet(fullKey, JSON.stringify(entry), this.windowMs);
        }
      } catch {
        // ignore
      }
    }
    const entry = this.localFallback.get(fullKey);
    if (entry) entry.totalHits = Math.max(0, entry.totalHits - 1);
  }

  async resetKey(key) {
    const fullKey = `${this.prefix}${key}`;
    await redisDel(fullKey);
    this.localFallback.delete(fullKey);
  }
}

function createRateLimitStore(windowMs) {
  if (process.env.REDIS_URL) {
    return new RedisRateLimitStore('rl:', windowMs);
  }
  return undefined;
}

module.exports = { RedisRateLimitStore, createRateLimitStore };
