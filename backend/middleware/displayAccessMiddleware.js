const { sendError } = require('../utils/apiResponse');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
}

function displayAccessMiddleware(req, res, next) {
  const allowed = (process.env.DISPLAY_ALLOWED_IPS || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

  if (allowed.length === 0) {
    return next();
  }

  const clientIp = getClientIp(req);
  const normalized = clientIp.replace(/^::ffff:/, '');
  const permitted = allowed.some((ip) => ip === clientIp || ip === normalized);

  if (!permitted) {
    return sendError(res, req, 403, 'errors.accessDenied');
  }

  next();
}

module.exports = displayAccessMiddleware;
