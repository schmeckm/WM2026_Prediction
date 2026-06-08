const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { sendError } = require('../utils/apiResponse');
const { getAllSettings } = require('../services/settingsService');
const { setPrizeImageUrl, clearPrizeImageUrl } = require('../services/prizeService');
const {
  getPrizesUploadDir,
  resolveExtension,
  buildImageUrl,
  deletePrizeImageFiles,
  parseRank,
  ALLOWED_EXTENSIONS,
} = require('../services/prizeImageService');
const { validateImageFile } = require('../utils/fileValidation');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

const prizeImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, getPrizesUploadDir()),
    filename: (req, file, cb) => {
      const rank = parseRank(req.params.rank);
      const ext = resolveExtension(file);
      if (!rank || !ext) return cb(new Error('INVALID_IMAGE'));
      cb(null, `prize-${rank}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('INVALID_IMAGE'));
  },
});

router.post(
  '/:rank/image',
  (req, res, next) => {
    if (!parseRank(req.params.rank)) {
      return sendError(res, req, 400, 'errors.prizeRankInvalid');
    }
    prizeImageUpload.single('image')(req, res, (err) => {
      if (err) {
        if (err.message === 'INVALID_IMAGE' || err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, req, 400, 'errors.prizeImageInvalid');
        }
        return sendError(res, req, 400, 'errors.prizeImageInvalid');
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const rank = parseRank(req.params.rank);
      if (!req.file) {
        return sendError(res, req, 400, 'errors.prizeImageRequired');
      }

      const imageCheck = validateImageFile(req.file);
      if (!imageCheck.ok) {
        fs.unlinkSync(req.file.path);
        return sendError(res, req, 400, 'errors.prizeImageInvalid');
      }

      const ext = path.extname(req.file.filename).toLowerCase();
      const dir = getPrizesUploadDir();
      for (const allowedExt of ALLOWED_EXTENSIONS) {
        if (allowedExt === ext) continue;
        const oldPath = path.join(dir, `prize-${rank}${allowedExt}`);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const imageUrl = buildImageUrl(rank, ext);
      await setPrizeImageUrl(rank, imageUrl);
      res.json(await getAllSettings());
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      sendError(res, req, 500, 'errors.prizeImageUploadFailed');
    }
  },
);

router.delete('/:rank/image', async (req, res) => {
  try {
    const rank = parseRank(req.params.rank);
    if (!rank) {
      return sendError(res, req, 400, 'errors.prizeRankInvalid');
    }

    deletePrizeImageFiles(rank);
    await clearPrizeImageUrl(rank);
    res.json(await getAllSettings());
  } catch (error) {
    sendError(res, req, 500, 'errors.prizeImageDeleteFailed');
  }
});

module.exports = router;
