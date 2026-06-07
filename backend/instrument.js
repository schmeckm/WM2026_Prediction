const Sentry = require('@sentry/node');
const { getAppVersion } = require('./utils/appVersion');

const enabled = Boolean(process.env.SENTRY_DSN) && process.env.NODE_ENV !== 'test';

if (enabled) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || `wm2026-backend@${getAppVersion()}`,
    tracesSampleRate: Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.headers?.authorization) {
        delete event.request.headers.authorization;
      }
      return event;
    },
  });
}

function isSentryEnabled() {
  return enabled;
}

module.exports = { Sentry, isSentryEnabled };
