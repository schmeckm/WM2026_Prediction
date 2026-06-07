const fs = require('fs');
const path = require('path');
const { resolveDatabasePath } = require('./paths');
const { applyRetention } = require('../services/backupRetentionService');
const { copyToOffsite } = require('../services/backupOffsiteService');

const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'sqlite');

function getDatabasePath() {
  return resolveDatabasePath();
}

function backupDatabase(prefix = 'backup') {
  const resolved = getDatabasePath();
  if (!fs.existsSync(resolved)) {
    return null;
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(BACKUP_DIR, `${prefix}-${stamp}.sqlite`);
  fs.copyFileSync(resolved, backupPath);

  const retention = applyRetention(BACKUP_DIR, {
    extension: '.sqlite',
    keepCount: parseInt(process.env.BACKUP_SQLITE_RETENTION || '7', 10),
  });

  const offsite = copyToOffsite(backupPath);

  return { path: backupPath, retention, offsite };
}

function listSqliteBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter((name) => name.endsWith('.sqlite'))
    .map((filename) => {
      const filePath = path.join(BACKUP_DIR, filename);
      const stat = fs.statSync(filePath);
      return {
        filename,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  BACKUP_DIR,
  backupDatabase,
  getDatabasePath,
  listSqliteBackups,
};
