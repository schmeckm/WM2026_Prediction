require('../config/loadEnv');
const { sequelize } = require('../models');
const { createOrPromoteAdmin } = require('../services/bootstrapAdminService');

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const email = getArg('--email') || process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = getArg('--password') || process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const firstName = getArg('--first-name') || 'Admin';
  const lastName = getArg('--last-name') || 'User';

  if (!email || !password) {
    console.error('\nVerwendung:');
    console.error('  npm run db:create-admin -- --email admin@example.com --password geheim123');
    console.error('  oder Umgebungsvariablen BOOTSTRAP_ADMIN_EMAIL und BOOTSTRAP_ADMIN_PASSWORD setzen.\n');
    process.exit(1);
  }

  try {
    const { initDatabase } = require('../app');
    await initDatabase();

    const result = await createOrPromoteAdmin({
      email,
      password,
      firstName,
      lastName,
    });

    if (result.created) {
      console.log(`\nAdmin erstellt: ${email}`);
    } else {
      console.log(`\nBestehender Benutzer ist jetzt Admin: ${email}`);
    }
    console.log('Du kannst dich jetzt im Frontend anmelden.\n');
  } catch (error) {
    console.error('Admin-Erstellung fehlgeschlagen:', error.message || error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
