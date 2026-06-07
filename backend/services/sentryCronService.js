const { Sentry, isSentryEnabled } = require('../instrument');

async function runWithCronMonitor(slug, fn, monitorConfig = null) {
  if (!isSentryEnabled()) {
    return fn();
  }

  let checkInId;
  try {
    checkInId = Sentry.captureCheckIn({
      monitorSlug: slug,
      status: 'in_progress',
      ...(monitorConfig ? { upsertMonitorConfig: monitorConfig } : {}),
    });

    const result = await fn();

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: slug,
      status: 'ok',
    });

    return result;
  } catch (error) {
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: slug,
      status: 'error',
    });
    throw error;
  }
}

function captureException(error, context = {}) {
  if (!isSentryEnabled()) return;
  Sentry.captureException(error, { extra: context });
}

function captureSyncSummaryErrors(summary, syncType) {
  if (!isSentryEnabled() || !summary?.errors?.length) return;

  Sentry.captureMessage(`Sync completed with ${summary.errorCount} errors`, {
    level: 'warning',
    extra: {
      syncType,
      errors: summary.errors.slice(0, 10),
      updatedCount: summary.updatedCount,
      skippedCount: summary.skippedCount,
    },
  });
}

module.exports = {
  runWithCronMonitor,
  captureException,
  captureSyncSummaryErrors,
};
