const fs = require('fs');
const path = require('path');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const VALID_RANKS = new Set([1, 2, 3]);

function getPrizesUploadDir() {
  const dir = path.join(__dirname, '..', 'uploads', 'prizes');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function resolveExtension(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) return ext;
  const mimeMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return mimeMap[file.mimetype] || null;
}

function buildImageUrl(rank, ext) {
  return `/uploads/prizes/prize-${rank}${ext}`;
}

function deletePrizeImageFiles(rank) {
  const dir = getPrizesUploadDir();
  for (const ext of ALLOWED_EXTENSIONS) {
    const filePath = path.join(dir, `prize-${rank}${ext}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

function deleteImageByUrl(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('/uploads/prizes/')) return;
  const filePath = path.join(__dirname, '..', imageUrl.replace(/^\//, ''));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function parseRank(value) {
  const rank = Number(value);
  return VALID_RANKS.has(rank) ? rank : null;
}

module.exports = {
  ALLOWED_EXTENSIONS,
  VALID_RANKS,
  getPrizesUploadDir,
  resolveExtension,
  buildImageUrl,
  deletePrizeImageFiles,
  deleteImageByUrl,
  parseRank,
};
