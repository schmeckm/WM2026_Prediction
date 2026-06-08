const WEAK_JWT_SECRETS = new Set([
  '',
  'wm2026-docker-secret-change-me',
  'change-me',
  'secret',
  'test-jwt-secret-for-integration-tests',
  'changeme-set-a-long-random-jwt-secret-in-portainer',
]);

const WEAK_DB_PASSWORDS = new Set([
  '',
  'changeme-set-in-portainer',
  'postgres',
]);

function validateEnv() {
  const errors = [];
  const warnings = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  const jwtSecret = process.env.JWT_SECRET || '';
  if (!jwtSecret && !isTest) {
    errors.push('JWT_SECRET is required.');
  } else if (WEAK_JWT_SECRETS.has(jwtSecret) && isProduction) {
    errors.push('JWT_SECRET must be changed from the default value in production.');
  } else if (WEAK_JWT_SECRETS.has(jwtSecret) && !isTest) {
    warnings.push('JWT_SECRET uses a weak/default value.');
  }

  if (process.env.DB_DIALECT === 'postgres') {
    for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
      if (!process.env[key]) errors.push(`${key} is required when DB_DIALECT=postgres.`);
    }
    if (isProduction && WEAK_DB_PASSWORDS.has(process.env.DB_PASSWORD || '')) {
      errors.push('DB_PASSWORD must be changed from the default value in production.');
    }
  } else if ((process.env.DB_DIALECT || 'sqlite') === 'sqlite' && isProduction) {
    errors.push('DB_DIALECT=sqlite is not allowed in production. Use DB_DIALECT=postgres.');
  }

  const syncEnabled = process.env.FOOTBALL_API_SYNC_ENABLED !== 'false';
  if (syncEnabled && !process.env.FOOTBALL_API_KEY && isProduction) {
    warnings.push('FOOTBALL_API_KEY is not set while API sync is enabled.');
  }

  if (isProduction && !process.env.APP_URL) {
    warnings.push('APP_URL is not set – email links and OAuth redirects may be wrong.');
  }

  if (isProduction && (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*')) {
    errors.push('CORS_ORIGIN must be set to an explicit origin in production (not *).');
  }

  if (isProduction && !process.env.SENTRY_DSN) {
    warnings.push('SENTRY_DSN is not set – production errors during live matches will not be monitored.');
  }

  const aiEnabled = process.env.AI_FEATURES_ENABLED !== 'false';
  const openAiKey = (process.env.OPENAI_API_KEY || '').trim().replace(/^=+/, '');
  if (aiEnabled && !openAiKey && !isTest) {
    warnings.push('OPENAI_API_KEY is not set – AI features will show as inactive until configured.');
  }

  for (const msg of warnings) console.warn(`[Env] ${msg}`);
  if (errors.length > 0) {
    for (const msg of errors) console.error(`[Env] ${msg}`);
    if (isProduction) {
      throw new Error(`Environment validation failed: ${errors.join(' ')}`);
    }
  }
}

module.exports = { validateEnv, WEAK_JWT_SECRETS, WEAK_DB_PASSWORDS };
