const memoryStore = new Map();
const { redisGet, redisSet } = require('./redisClient');

async function getEntry(key) {
  try {
    const raw = await redisGet(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to memory
  }
  return memoryStore.get(key) || null;
}

async function setEntry(key, entry, ttlMs) {
  try {
    const stored = await redisSet(key, JSON.stringify(entry), ttlMs);
    if (stored) return;
  } catch {
    // fall through to memory
  }
  memoryStore.set(key, entry);
}

function resetForTests() {
  memoryStore.clear();
}

module.exports = {
  getEntry,
  setEntry,
  resetForTests,
};
