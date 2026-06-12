const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { Feedback } = require('../models');
const { sendError, sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

const ALLOWED_TYPES = new Set(['bug', 'change', 'feature']);

function normalizeText(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const type = normalizeText(req.body?.type, 20).toLowerCase();
    const title = normalizeText(req.body?.title, 140);
    const description = normalizeText(req.body?.description, 5000);
    const pageUrl = normalizeText(req.body?.pageUrl, 500);
    const appVersion = normalizeText(req.body?.appVersion, 60);

    if (!ALLOWED_TYPES.has(type) || !title || !description) {
      return sendError(res, req, 400, 'errors.requiredFields');
    }

    await Feedback.create({
      userId: req.user.id,
      type,
      title,
      description,
      status: 'open',
      pageUrl: pageUrl || null,
      appVersion: appVersion || null,
      userAgent: normalizeText(req.headers['user-agent'], 250) || null,
      ipAddress: normalizeText(req.ip, 80) || null,
    });

    return sendSuccess(res, req, 'messages.feedbackSubmitted');
  } catch (error) {
    console.error('Feedback create error:', error);
    return sendError(res, req, 500, 'errors.internalServer');
  }
});

module.exports = router;
