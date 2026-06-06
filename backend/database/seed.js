require('../config/loadEnv');
const { sequelize, Team, User } = require('../models');
const { seedDemoData } = require('./demoData');
const {
  createOrPromoteAdmin,
  resolveBootstrapCredentials,
  DEV_DEFAULT_ADMIN,
} = require('../services/bootstrapAdminService');

async function seedProductionAdmin() {
  const credentials = resolveBootstrapCredentials();
  if (!credentials) {
    console.error('\nABBRUCH: Kein Admin konfiguriert.');
    console.error('In Production setze BOOTSTRAP_ADMIN_EMAIL und BOOTSTRAP_ADMIN_PASSWORD in Portainer.');
    console.error('Oder: npm run db:create-admin -- --email ... --password ...\n');
    process.exit(1);
  }

  const { initDatabase } = require('../app');
  await initDatabase();

  const result = await createOrPromoteAdmin({
    email: credentials.email,
    password: credentials.password,
  });

  console.log('\n=== Production-Admin angelegt ===');
  if (result.created) {
    console.log(`Admin erstellt: ${credentials.email}`);
  } else {
    console.log(`Bestehender Benutzer ist Admin: ${credentials.email}`);
  }
  if (credentials.source === 'dev-default') {
    console.log(`(Dev-Default: ${DEV_DEFAULT_ADMIN.email} / ${DEV_DEFAULT_ADMIN.password})`);
  }
  console.log('Production-Teams bleiben unverändert.\n');
}

async function seedFullDemo() {
  const { initDatabase } = require('../app');
  await initDatabase();
  await seedDemoData();

  console.log('\n=== Demo-Daten geladen (leere Datenbank) ===');
  console.log(`Admin: ${DEV_DEFAULT_ADMIN.email} / ${DEV_DEFAULT_ADMIN.password}`);
  console.log('User: max.mueller@example.com / user123');
}

async function seed() {
  try {
    const [userCount, teamCount] = await Promise.all([
      User.count().catch(() => 0),
      Team.count().catch(() => 0),
    ]);

    if (userCount > 0) {
      console.error('\nABBRUCH: Die Datenbank enthält bereits Benutzer.');
      console.error('Seed überschreibt keine bestehenden Daten.');
      console.error('Zum bewussten Zurücksetzen: npm run db:reset -- --confirm\n');
      process.exit(1);
    }

    if (teamCount > 0) {
      await seedProductionAdmin();
      return;
    }

    await seedFullDemo();
  } catch (error) {
    console.error('Seed fehlgeschlagen:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
