const fs = require('fs');
const path = require('path');
const { applyRetention } = require('./backupRetentionService');
const { copyDirectoryToOffsite } = require('./backupOffsiteService');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const BACKUP_ROOT = path.join(__dirname, '..', 'backups', 'uploads');

function buildFolderName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `uploads-${stamp}`;
}

async function createUploadsBackup() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    return { skipped: true, reason: 'no_uploads_dir' };
  }

  const entries = fs.readdirSync(UPLOADS_DIR);
  if (entries.length === 0) {
    return { skipped: true, reason: 'empty_uploads' };
  }

  const folderName = buildFolderName();
  const targetDir = path.join(BACKUP_ROOT, folderName);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(UPLOADS_DIR, targetDir, { recursive: true });

  const retention = applyRetention(BACKUP_ROOT, {
    prefix: 'uploads-',
    keepCount: parseInt(process.env.BACKUP_UPLOADS_RETENTION || '7', 10),
  });

  const offsite = copyDirectoryToOffsite(targetDir, folderName);

  return {
    folderName,
    path: targetDir,
    fileCount: entries.length,
    retention,
    offsite,
  };
}

module.exports = {
  UPLOADS_DIR,
  BACKUP_ROOT,
  createUploadsBackup,
};
