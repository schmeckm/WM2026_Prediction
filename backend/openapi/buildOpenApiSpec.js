const fs = require('fs');
const path = require('path');
const { getAppVersion } = require('../utils/appVersion');

const ROUTES_DIR = path.join(__dirname, '..', 'routes');

const ROUTE_MOUNT_MAP = [
  { mount: '/auth', file: 'authRoutes.js', tag: 'Auth' },
  { mount: '/users', file: 'userRoutes.js', tag: 'Users' },
  { mount: '/teams', file: 'teamRoutes.js', tag: 'Teams' },
  { mount: '/matches', file: 'matchRoutes.js', tag: 'Matches' },
  { mount: '/predictions', file: 'predictionRoutes.js', tag: 'Predictions' },
  { mount: '/leaderboard', file: 'leaderboardRoutes.js', tag: 'Leaderboard' },
  { mount: '/scoring-rules', file: 'scoringRuleRoutes.js', tag: 'Scoring Rules' },
  { mount: '/admin', file: 'adminRoutes.js', tag: 'Admin' },
  { mount: '/admin/sync', file: 'syncRoutes.js', tag: 'Admin Sync' },
  { mount: '/bonus-questions', file: 'bonusRoutes.js', tag: 'Bonus Questions', routerName: 'router' },
  { mount: '/admin/bonus-questions', file: 'bonusRoutes.js', tag: 'Admin Bonus', routerName: 'adminRouter' },
  { mount: '/statistics', file: 'statisticsRoutes.js', tag: 'Statistics' },
  { mount: '/notifications', file: 'notificationRoutes.js', tag: 'Notifications' },
  { mount: '/admin/audit-log', file: 'auditRoutes.js', tag: 'Audit Log' },
  { mount: '/admin/email', file: 'emailRoutes.js', tag: 'Admin Email' },
  { mount: '/settings', file: 'settingsRoutes.js', tag: 'Settings' },
  { mount: '/admin/system', file: 'systemRoutes.js', tag: 'System' },
  { mount: '/ai', file: 'aiRoutes.js', tag: 'AI' },
  { mount: '/football', file: 'footballRoutes.js', tag: 'Football Data' },
  { mount: '/player-images', file: 'playerImageRoutes.js', tag: 'Player Images' },
  { mount: '/admin/player-images', file: 'adminPlayerImageRoutes.js', tag: 'Admin Player Images' },
  { mount: '/display', file: 'displayRoutes.js', tag: 'Display' },
  { mount: '/admin/prizes', file: 'prizeRoutes.js', tag: 'Admin Prizes' },
  { mount: '/admin/ai', file: 'adminAiRoutes.js', tag: 'Admin AI' },
  { mount: '/challenges', file: 'challengeRoutes.js', tag: 'Challenges' },
  { mount: '/achievements', file: 'achievementRoutes.js', tag: 'Achievements' },
  { mount: '/what-if', file: 'whatIfRoutes.js', tag: 'What-If' },
  { mount: '/activity', file: 'activityRoutes.js', tag: 'Activity' },
  { mount: '/feedback', file: 'feedbackRoutes.js', tag: 'Feedback' },
  { mount: '/admin/feedback', file: 'adminFeedbackRoutes.js', tag: 'Admin Feedback' },
  { mount: '/billing', file: 'billingRoutes.js', tag: 'Billing' },
];

const EXTRA_ROUTES = [
  { method: 'get', path: '/health', tag: 'Health', public: true },
  { method: 'get', path: '/health/detailed', tag: 'Health', admin: true },
  { method: 'get', path: '/metrics', tag: 'Metrics', admin: true },
  { method: 'put', path: '/admin/settings', tag: 'Settings', admin: true },
];

const PUBLIC_PATH_PREFIXES = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/google',
  '/auth/google/callback',
  '/auth/sso',
  '/billing/webhook',
  '/health',
  '/display',
  '/football',
  '/teams',
  '/settings',
];

const ROUTE_HANDLER_PATTERN = /(?:router|adminRouter)\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/gi;

function toOpenApiPath(expressPath) {
  return expressPath.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function joinPaths(mount, routePath) {
  const base = mount.endsWith('/') ? mount.slice(0, -1) : mount;
  if (!routePath || routePath === '/') return base || '/';
  const suffix = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${base}${suffix}`;
}

function scanRouteFile(filePath, routerName = null) {
  const content = fs.readFileSync(filePath, 'utf8');
  const routes = [];
  let match;

  if (routerName) {
    const scopedPattern = new RegExp(
      `${routerName}\\.(get|post|put|patch|delete)\\(\\s*['"\`]([^'"\`]+)['"\`]`,
      'gi',
    );
    while ((match = scopedPattern.exec(content)) !== null) {
      routes.push({ method: match[1].toLowerCase(), path: match[2] });
    }
    return routes;
  }

  while ((match = ROUTE_HANDLER_PATTERN.exec(content)) !== null) {
    routes.push({ method: match[1].toLowerCase(), path: match[2] });
  }
  return routes;
}

function isPublicPath(fullPath) {
  return PUBLIC_PATH_PREFIXES.some((prefix) => fullPath === prefix || fullPath.startsWith(`${prefix}/`));
}

function buildOperation(method, tag, options = {}) {
  const operation = {
    tags: [tag],
    summary: `${method.toUpperCase()} ${options.summaryPath || ''}`.trim(),
    responses: {
      200: { description: 'Successful response' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
      404: { description: 'Not found' },
      500: { description: 'Internal server error' },
    },
  };

  if (method === 'post' || method === 'put' || method === 'patch') {
    operation.requestBody = {
      content: {
        'application/json': {
          schema: { type: 'object' },
        },
      },
    };
  }

  if (!options.public) {
    operation.security = [{ bearerAuth: [] }];
  }

  if (options.admin) {
    operation.description = 'Requires admin role.';
  }

  return operation;
}

function addPath(paths, fullPath, method, operation) {
  const openApiPath = toOpenApiPath(fullPath);
  if (!paths[openApiPath]) paths[openApiPath] = {};
  paths[openApiPath][method] = operation;
}

function buildOpenApiSpec() {
  const paths = {};

  for (const entry of ROUTE_MOUNT_MAP) {
    const filePath = path.join(ROUTES_DIR, entry.file);
    if (!fs.existsSync(filePath)) continue;

    const routes = scanRouteFile(filePath, entry.routerName || null);
    for (const route of routes) {
      const fullPath = joinPaths(entry.mount, route.path);
      addPath(
        paths,
        fullPath,
        route.method,
        buildOperation(route.method, entry.tag, {
          summaryPath: fullPath,
          public: isPublicPath(fullPath),
          admin: entry.mount.startsWith('/admin'),
        }),
      );
    }
  }

  for (const route of EXTRA_ROUTES) {
    addPath(
      paths,
      route.path,
      route.method,
      buildOperation(route.method, route.tag, {
        summaryPath: route.path,
        public: route.public,
        admin: route.admin,
      }),
    );
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'WM 2026 Tippspiel API',
      version: getAppVersion(),
      description: [
        'REST API for the WM 2026 prediction game.',
        '',
        'Base path: `/api` (alias `/api/v1`).',
        '',
        'Authentication: Bearer JWT in the `Authorization` header.',
        'Locale: optional `X-Language` header or `lang` query parameter on GET requests.',
      ].join('\n'),
    },
    servers: [{ url: '/api', description: 'API base path' }],
    tags: [...new Set(ROUTE_MOUNT_MAP.map((e) => e.tag).concat(EXTRA_ROUTES.map((e) => e.tag)))].map((name) => ({
      name,
    })),
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from POST /auth/login or /auth/refresh',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };
}

module.exports = { buildOpenApiSpec };
