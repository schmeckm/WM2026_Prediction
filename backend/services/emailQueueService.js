const DEFAULT_CONCURRENCY = parseInt(process.env.EMAIL_QUEUE_CONCURRENCY || '5', 10);

async function runWithConcurrency(items, worker, concurrency = DEFAULT_CONCURRENCY) {
  if (!items.length) return [];

  const results = new Array(items.length);
  let index = 0;
  const limit = Math.max(1, Math.min(concurrency, items.length));

  async function runner() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => runner()));
  return results;
}

module.exports = { runWithConcurrency, DEFAULT_CONCURRENCY };
