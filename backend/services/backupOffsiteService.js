const fs = require('fs');
const path = require('path');

function copyToOffsite(sourcePath) {
  const offsiteDir = process.env.BACKUP_OFFSITE_DIR;
  if (!offsiteDir || !sourcePath || !fs.existsSync(sourcePath)) {
    return { skipped: true, reason: 'not_configured_or_missing_source' };
  }

  fs.mkdirSync(offsiteDir, { recursive: true });
  const targetPath = path.join(offsiteDir, path.basename(sourcePath));
  fs.copyFileSync(sourcePath, targetPath);

  return { copied: true, targetPath };
}

function copyDirectoryToOffsite(sourceDir, folderName) {
  const offsiteDir = process.env.BACKUP_OFFSITE_DIR;
  if (!offsiteDir || !sourceDir || !fs.existsSync(sourceDir)) {
    return { skipped: true, reason: 'not_configured_or_missing_source' };
  }

  const targetDir = path.join(offsiteDir, folderName);
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const src = path.join(sourceDir, entry.name);
    const dest = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  return { copied: true, targetDir };
}

module.exports = { copyToOffsite, copyDirectoryToOffsite };
