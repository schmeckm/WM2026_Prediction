const fs = require('fs');
const path = require('path');

function applyRetention(dir, options = {}) {
  const {
    extension = null,
    prefix = null,
    keepCount = 7,
  } = options;

  if (!fs.existsSync(dir) || keepCount < 1) {
    return { removed: 0, kept: 0 };
  }

  let files = fs.readdirSync(dir)
    .filter((name) => {
      if (extension && !name.endsWith(extension)) return false;
      if (prefix && !name.startsWith(prefix)) return false;
      return fs.statSync(path.join(dir, name)).isFile();
    })
    .map((name) => {
      const filePath = path.join(dir, name);
      const stat = fs.statSync(filePath);
      return { name, filePath, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  const kept = files.slice(0, keepCount);
  const toRemove = files.slice(keepCount);
  for (const file of toRemove) {
    fs.unlinkSync(file.filePath);
  }

  return { removed: toRemove.length, kept: kept.length };
}

module.exports = { applyRetention };
