const { User, Team } = require('../models');
const { ensureProductionTeams } = require('../database/teamsSeed');

const DEV_DEFAULT_ADMIN = {
  email: 'admin@example.com',
  password: 'admin123',
};

function resolveBootstrapCredentials() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (email && password) {
    return { email, password, source: 'env' };
  }
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  return { ...DEV_DEFAULT_ADMIN, source: 'dev-default' };
}

async function resolveDefaultTeam() {
  let team = await Team.findOne({ order: [['id', 'ASC']] });
  if (!team) {
    await ensureProductionTeams(Team);
    team = await Team.findOne({ order: [['id', 'ASC']] });
  }
  if (!team) {
    throw new Error('Kein Team gefunden. Starte den Server einmal oder führe npm run db:seed-teams aus.');
  }
  return team;
}

async function createOrPromoteAdmin({
  email,
  password,
  firstName = 'Admin',
  lastName = 'User',
  resetPassword = true,
}) {
  const normalizedEmail = email?.toLowerCase().trim();
  if (!normalizedEmail) {
    throw new Error('E-Mail ist erforderlich.');
  }
  const minLength = process.env.NODE_ENV === 'production' ? 10 : 6;
  if (!password || password.length < minLength) {
    throw new Error(`Passwort muss mindestens ${minLength} Zeichen haben.`);
  }

  const team = await resolveDefaultTeam();
  const existing = await User.findOne({ where: { email: normalizedEmail } });

  if (existing) {
    const updates = {
      role: 'admin',
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    };
    if (resetPassword) {
      updates.password = password;
    }
    if (!existing.teamId) {
      updates.teamId = team.id;
    }
    await existing.update(updates);
    return { user: existing, created: false, promoted: true };
  }

  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    password,
    role: 'admin',
    teamId: team.id,
    emailVerified: true,
  });

  return { user, created: true, promoted: false };
}

async function ensureBootstrapAdmin() {
  const adminCount = await User.count({ where: { role: 'admin' } });
  if (adminCount > 0) {
    return null;
  }

  const credentials = resolveBootstrapCredentials();
  if (!credentials) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[Bootstrap] Kein Admin in der Datenbank. Setze BOOTSTRAP_ADMIN_EMAIL und BOOTSTRAP_ADMIN_PASSWORD '
        + 'in Portainer, führe npm run seed aus oder: npm run db:create-admin -- --email ... --password ...',
      );
    }
    return null;
  }

  const { email, password } = credentials;
  const result = await createOrPromoteAdmin({ email, password });
  const action = result.created ? 'erstellt' : 'befördert';
  console.log(`[Bootstrap] Admin ${action}: ${email}`);
  return result;
}

module.exports = {
  createOrPromoteAdmin,
  ensureBootstrapAdmin,
  resolveBootstrapCredentials,
  resolveDefaultTeam,
  DEV_DEFAULT_ADMIN,
};
