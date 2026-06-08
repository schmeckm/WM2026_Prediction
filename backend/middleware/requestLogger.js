function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      const userId = req.user?.id || '-';
      const ip = req.ip || req.headers['x-forwarded-for'] || '-';
      const requestId = req.requestId || '-';
      console.log(
        JSON.stringify({
          level: 'info',
          requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: duration,
          userId,
          ip,
        }),
      );
    }
  });
  next();
}

module.exports = requestLogger;
