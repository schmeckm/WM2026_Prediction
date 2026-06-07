import * as Sentry from '@sentry/vue';

const dsn = import.meta.env.VITE_SENTRY_DSN;
const enabled = Boolean(dsn) && import.meta.env.MODE !== 'test';

export function initSentry(app, router) {
  if (!enabled) return;

  Sentry.init({
    app,
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE
      || `wm2026-frontend@${import.meta.env.VITE_APP_VERSION || 'dev'}`,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: Number.parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: Number.parseFloat(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE || '1'),
    sendDefaultPii: false,
  });
}

export { Sentry };
