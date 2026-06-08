const jwt = require('jsonwebtoken');
const { User, Team } = require('../models');
const { applyUserLocale } = require('./localeMiddleware');
const { isTokenBlacklisted } = require('../services/tokenBlacklistService');

async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (await isTokenBlacklisted(token)) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Team, as: 'team' }],
    });

    if (user) {
      req.user = user;
      applyUserLocale(req);
    }
    next();
  } catch {
    next();
  }
}

module.exports = optionalAuthMiddleware;
