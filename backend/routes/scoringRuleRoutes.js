const express = require('express');
const { sendError, translate } = require('../utils/apiResponse');
const { ScoringRule } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  buildDefaultKnockoutStagePoints,
  normalizeKnockoutStagePoints,
} = require('../services/scoringRulesService');

const router = express.Router();

function serializeScoringRules(rules) {
  const json = rules.toJSON();
  json.knockoutStagePoints = normalizeKnockoutStagePoints(json.knockoutStagePoints, json);
  json.knockoutStagePointsEnabled = !!json.knockoutStagePointsEnabled;
  return json;
}

function applyScoringRuleUpdates(rules, body) {
  const fields = ['exactResultPoints', 'goalDifferencePoints', 'tendencyPoints', 'wrongPredictionPoints'];
  fields.forEach((field) => {
    if (body[field] !== undefined) {
      rules[field] = parseInt(body[field], 10);
    }
  });

  if (body.knockoutStagePointsEnabled !== undefined) {
    rules.knockoutStagePointsEnabled = !!body.knockoutStagePointsEnabled;
  }

  if (body.knockoutStagePoints !== undefined) {
    rules.knockoutStagePoints = normalizeKnockoutStagePoints(body.knockoutStagePoints, rules);
  } else if (body.knockoutStagePointsEnabled && !rules.knockoutStagePoints) {
    rules.knockoutStagePoints = buildDefaultKnockoutStagePoints(rules);
  }
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    let rules = await ScoringRule.findOne();
    if (!rules) {
      rules = await ScoringRule.create({
        exactResultPoints: 4,
        goalDifferencePoints: 3,
        tendencyPoints: 2,
        wrongPredictionPoints: 0,
      });
    }
    res.json(serializeScoringRules(rules));
  } catch (error) {
    sendError(res, req, 500, 'errors.scoringRulesLoadFailed');
  }
});

router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let rules = await ScoringRule.findOne();
    if (!rules) {
      rules = await ScoringRule.create(req.body);
    } else {
      applyScoringRuleUpdates(rules, req.body);
      await rules.save();
    }
    res.json(serializeScoringRules(rules));
  } catch (error) {
    sendError(res, req, 500, 'errors.scoringRulesUpdateFailed');
  }
});

module.exports = router;
