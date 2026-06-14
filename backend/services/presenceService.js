const { User, Team } = require('../models');
const { ensureRedis } = require('./redisClient');

const PRESENCE_KEY = 'presence:online';
const TTL_MS = 90_000;
const memoryPresence = new Map();

let redisClient = null;

async function getRedis() {
  if (!(await ensureRedis())) return null;
  if (!redisClient) {
    try {
      const Redis = require('ioredis');
      redisClient = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
    } catch {
      return null;
    }
  }
  return redisClient;
}

function touchMemory(userId) {
  memoryPresence.set(userId, Date.now());
  const cutoff = Date.now() - TTL_MS;
  for (const [id, ts] of memoryPresence) {
    if (ts < cutoff) memoryPresence.delete(id);
  }
}

function removeMemory(userId) {
  memoryPresence.delete(userId);
}

function getMemoryOnlineIds() {
  const cutoff = Date.now() - TTL_MS;
  const ids = [];
  for (const [id, ts] of memoryPresence) {
    if (ts >= cutoff) ids.push(id);
    else memoryPresence.delete(id);
  }
  return ids;
}

async function touch(userId) {
  if (!userId) return;
  const redis = await getRedis();
  const now = Date.now();
  if (redis) {
    try {
      await redis.zadd(PRESENCE_KEY, now, String(userId));
      await redis.zremrangebyscore(PRESENCE_KEY, 0, now - TTL_MS);
      return;
    } catch {
      // fall through to memory
    }
  }
  touchMemory(userId);
}

async function remove(userId) {
  if (!userId) return;
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.zrem(PRESENCE_KEY, String(userId));
      return;
    } catch {
      // fall through
    }
  }
  removeMemory(userId);
}

async function getOnlineUserIds() {
  const redis = await getRedis();
  const cutoff = Date.now() - TTL_MS;
  if (redis) {
    try {
      await redis.zremrangebyscore(PRESENCE_KEY, 0, cutoff);
      const ids = await redis.zrangebyscore(PRESENCE_KEY, cutoff, '+inf');
      return ids.map((id) => parseInt(id, 10)).filter(Number.isFinite);
    } catch {
      // fall through
    }
  }
  return getMemoryOnlineIds();
}

async function getOnlineUsers() {
  const ids = await getOnlineUserIds();
  if (ids.length === 0) {
    return { count: 0, users: [], byTeam: [] };
  }

  const users = await User.findAll({
    where: { id: ids },
    attributes: ['id', 'firstName', 'lastName', 'imageUrl', 'avatarColor', 'avatarEmoji', 'teamId', 'role'],
    include: [{ model: Team, as: 'team', attributes: ['id', 'name'] }],
    order: [['firstName', 'ASC'], ['lastName', 'ASC']],
  });

  const userDtos = users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    imageUrl: u.imageUrl || null,
    avatarColor: u.avatarColor || 'default',
    avatarEmoji: u.avatarEmoji || null,
    teamId: u.teamId || null,
    teamName: u.team?.name || null,
    role: u.role,
  }));

  const teamMap = new Map();
  for (const user of userDtos) {
    const key = user.teamName || '—';
    if (!teamMap.has(key)) teamMap.set(key, []);
    teamMap.get(key).push(user);
  }

  const byTeam = [...teamMap.entries()]
    .map(([teamName, members]) => ({ teamName, count: members.length, members }))
    .sort((a, b) => b.count - a.count || a.teamName.localeCompare(b.teamName));

  return {
    count: userDtos.length,
    users: userDtos,
    byTeam,
  };
}

function resetForTests() {
  memoryPresence.clear();
  redisClient = null;
}

module.exports = {
  touch,
  remove,
  getOnlineUsers,
  resetForTests,
};
