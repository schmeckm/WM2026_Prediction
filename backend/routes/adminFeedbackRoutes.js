const express = require('express');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { Feedback, User, Team } = require('../models');
const { sendError, sendSuccess } = require('../utils/apiResponse');
const { createGithubIssue, buildFeedbackIssueBody } = require('../services/githubIssueService');

const router = express.Router();

const ALLOWED_STATUSES = new Set(['open', 'in_progress', 'done', 'closed']);
const ALLOWED_TYPES = new Set(['bug', 'change', 'feature']);

router.use(authMiddleware, adminMiddleware);

function clampInt(value, fallback, min, max) {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

router.get('/', async (req, res) => {
  try {
    const limit = clampInt(req.query.limit, 100, 1, 500);
    const offset = clampInt(req.query.offset, 0, 0, 1000000);

    const where = {};
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const type = typeof req.query.type === 'string' ? req.query.type.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (status && ALLOWED_STATUSES.has(status)) where.status = status;
    if (type && ALLOWED_TYPES.has(type)) where.type = type;
    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }

    const result = await Feedback.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'teamId'],
        include: [{ model: Team, as: 'team', attributes: ['id', 'name'] }],
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      items: result.rows,
      total: result.count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Admin feedback list error:', error);
    sendError(res, req, 500, 'errors.internalServer');
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = clampInt(req.params.id, null, 1, 1000000000);
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    if (!id || !ALLOWED_STATUSES.has(status)) {
      return sendError(res, req, 400, 'errors.requiredFields');
    }

    const feedback = await Feedback.findByPk(id);
    if (!feedback) return sendError(res, req, 404, 'errors.feedbackNotFound');

    await feedback.update({ status });
    return res.json({ message: 'ok', item: feedback });
  } catch (error) {
    console.error('Admin feedback update error:', error);
    return sendError(res, req, 500, 'errors.internalServer');
  }
});

router.post('/:id/github-issue', async (req, res) => {
  try {
    const token = String(process.env.GITHUB_TOKEN || '').trim();
    const repo = String(process.env.GITHUB_REPO || '').trim();
    if (!token || !repo) {
      return sendError(res, req, 503, 'errors.githubNotConfigured');
    }

    const id = clampInt(req.params.id, null, 1, 1000000000);
    if (!id) return sendError(res, req, 400, 'errors.requiredFields');

    const feedback = await Feedback.findByPk(id);
    if (!feedback) return sendError(res, req, 404, 'errors.feedbackNotFound');
    if (feedback.githubIssueUrl || feedback.githubIssueNumber) {
      return res.json({
        message: 'ok',
        issueUrl: feedback.githubIssueUrl,
        issueNumber: feedback.githubIssueNumber,
      });
    }

    const labels = String(process.env.GITHUB_FEEDBACK_LABELS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const issueTitle = `[${feedback.type}] ${feedback.title}`.slice(0, 255);
    const issueBody = buildFeedbackIssueBody(feedback);
    const issue = await createGithubIssue({
      token,
      repo,
      title: issueTitle,
      body: issueBody,
      labels,
    });

    await feedback.update({
      githubIssueNumber: issue.number || null,
      githubIssueUrl: issue.html_url || null,
      githubIssueCreatedAt: new Date(),
      status: feedback.status === 'open' ? 'in_progress' : feedback.status,
    });

    return sendSuccess(res, req, 'messages.githubIssueCreated', null, {
      issueUrl: feedback.githubIssueUrl,
      issueNumber: feedback.githubIssueNumber,
    });
  } catch (error) {
    console.error('GitHub issue create error:', error);
    return sendError(res, req, 500, 'errors.githubIssueCreateFailed');
  }
});

module.exports = router;
