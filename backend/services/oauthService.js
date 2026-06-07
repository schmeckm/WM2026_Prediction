const crypto = require('crypto');

function randomUnusedPassword() {
  return crypto.randomBytes(32).toString('hex');
}
const { Issuer, generators } = require('openid-client');
const { User, Team } = require('../models');
const { getSetting } = require('./settingsService');
const { normalizeLocale } = require('./i18nService');
const { getAppUrl } = require('./authTokenService');
const { importProfileImageFromUrl } = require('./userImageService');

const STATE_TTL_MS = 10 * 60 * 1000;
const EXCHANGE_TTL_MS = 5 * 60 * 1000;

const pendingStates = new Map();
const exchangeCodes = new Map();

let googleClient = null;

function isGoogleEnabled() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function getGoogleProviderStatus() {
  return {
    google: isGoogleEnabled(),
    googleConfig: {
      clientId: !!process.env.GOOGLE_CLIENT_ID,
      clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: !!process.env.GOOGLE_CALLBACK_URL,
    },
  };
}

function getGoogleCallbackUrl() {
  return process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';
}

async function getGoogleClient() {
  if (!isGoogleEnabled()) return null;
  if (!googleClient) {
    const issuer = await Issuer.discover('https://accounts.google.com');
    googleClient = new issuer.Client({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: [getGoogleCallbackUrl()],
      response_types: ['code'],
    });
  }
  return googleClient;
}

function cleanupExpired() {
  const now = Date.now();
  for (const [key, val] of pendingStates) {
    if (now - val.createdAt > STATE_TTL_MS) pendingStates.delete(key);
  }
  for (const [key, val] of exchangeCodes) {
    if (now > val.expiresAt) exchangeCodes.delete(key);
  }
}

function createExchangeCode(data) {
  cleanupExpired();
  const code = crypto.randomBytes(32).toString('hex');
  exchangeCodes.set(code, { data, expiresAt: Date.now() + EXCHANGE_TTL_MS });
  return code;
}

function consumeExchangeCode(code) {
  cleanupExpired();
  const entry = exchangeCodes.get(code);
  if (!entry || Date.now() > entry.expiresAt) {
    exchangeCodes.delete(code);
    return null;
  }
  exchangeCodes.delete(code);
  return entry.data;
}

function peekExchangeCode(code) {
  cleanupExpired();
  const entry = exchangeCodes.get(code);
  if (!entry || Date.now() > entry.expiresAt) {
    exchangeCodes.delete(code);
    return null;
  }
  return entry.data;
}

function getAllowedEmailDomains() {
  const raw = process.env.SSO_ALLOWED_EMAIL_DOMAINS || '';
  return raw.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
}

function isEmailDomainAllowed(email) {
  const domains = getAllowedEmailDomains();
  if (domains.length === 0) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  return !!(domain && domains.includes(domain));
}

async function startGoogleAuth(language) {
  const client = await getGoogleClient();
  if (!client) throw new Error('GOOGLE_DISABLED');

  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const state = generators.state();

  pendingStates.set(state, {
    codeVerifier,
    createdAt: Date.now(),
    language: normalizeLocale(language),
  });

  return client.authorizationUrl({
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    redirect_uri: getGoogleCallbackUrl(),
  });
}

async function exchangeGoogleTokens(code, codeVerifier) {
  const redirectUri = getGoogleCallbackUrl();
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await response.json();
  if (data.error) {
    console.error('Google token exchange failed:', data);
    const err = new Error(data.error_description || data.error);
    err.oauthError = data.error;
    throw err;
  }
  return data;
}

async function fetchGoogleUserProfile(accessToken) {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('GOOGLE_USERINFO_FAILED');
  }
  return response.json();
}

async function handleGoogleCallback(code, state) {
  const pending = pendingStates.get(state);
  pendingStates.delete(state);
  if (!pending) throw new Error('INVALID_STATE');

  const tokens = await exchangeGoogleTokens(code, pending.codeVerifier);
  const userinfo = await fetchGoogleUserProfile(tokens.access_token);

  const fullName = userinfo.name || '';
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    provider: 'google',
    providerId: userinfo.sub,
    email: userinfo.email?.toLowerCase().trim(),
    emailVerified: userinfo.email_verified === true,
    firstName: userinfo.given_name || nameParts[0] || 'User',
    lastName: userinfo.family_name || nameParts.slice(1).join(' ') || '',
    picture: userinfo.picture || null,
    language: pending.language,
  };
}

async function applyGoogleProfileImage(user, pictureUrl) {
  if (!pictureUrl || user.imageUrl) return user;
  try {
    const imageUrl = await importProfileImageFromUrl(user.id, pictureUrl);
    if (imageUrl) {
      await user.update({ imageUrl });
      user.imageUrl = imageUrl;
    }
  } catch (error) {
    console.warn('Google profile image import skipped:', error.message);
  }
  return user;
}

async function linkGoogleProfileToUser(user, profile) {
  await user.update({
    providerId: profile.providerId,
    emailVerified: true,
  });
  return applyGoogleProfileImage(user, profile.picture);
}

async function findOrCreateSsoUser(profile, issueToken) {
  let user = await User.findOne({
    where: { providerId: profile.providerId },
    include: [{ model: Team, as: 'team' }],
  });

  if (!user) {
    const byEmail = await User.findOne({
      where: { email: profile.email },
      include: [{ model: Team, as: 'team' }],
    });

    if (byEmail) {
      const provider = byEmail.authProvider || 'local';
      if (provider === 'local' || provider === profile.provider) {
        user = await linkGoogleProfileToUser(byEmail, profile);
      } else {
        return { error: 'other_provider' };
      }
    }
  }

  if (user) {
    const updates = {};
    if (!user.emailVerified) updates.emailVerified = true;
    if (profile.firstName && user.firstName === 'User') updates.firstName = profile.firstName;
    if (profile.lastName && !user.lastName) updates.lastName = profile.lastName;
    if (Object.keys(updates).length > 0) {
      await user.update(updates);
    }

    await applyGoogleProfileImage(user, profile.picture);

    const requireTeam = await getSetting('requireTeamOnRegistration', true);
    if (requireTeam && !user.teamId && user.role !== 'admin') {
      return { requiresTeam: true, pending: profile, existingUserId: user.id };
    }

    const fresh = await User.findByPk(user.id, {
      include: [{ model: Team, as: 'team' }],
    });
    return { token: issueToken(fresh), user: fresh.toSafeJSON() };
  }

  const registrationOpen = await getSetting('registrationEnabled', true);
  if (!registrationOpen) {
    return { error: 'registration_disabled' };
  }

  const requireTeam = await getSetting('requireTeamOnRegistration', true);
  if (requireTeam) {
    return { requiresTeam: true, pending: profile };
  }

  const newUser = await User.create({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    password: randomUnusedPassword(),
    authProvider: profile.provider,
    providerId: profile.providerId,
    role: 'user',
    language: profile.language,
    emailVerified: true,
  });

  await applyGoogleProfileImage(newUser, profile.picture);

  const userWithTeam = await User.findByPk(newUser.id, {
    include: [{ model: Team, as: 'team' }],
  });

  return { token: issueToken(newUser), user: userWithTeam.toSafeJSON() };
}

async function completeSsoRegistration(code, teamId, issueToken) {
  const data = consumeExchangeCode(code);
  if (!data?.requiresTeam || !data.pending) {
    return { error: 'invalid_code' };
  }

  const { pending, existingUserId } = data;
  const requireTeam = await getSetting('requireTeamOnRegistration', true);

  if (requireTeam && !teamId) {
    return { error: 'team_required' };
  }

  if (teamId) {
    const team = await Team.findByPk(teamId);
    if (!team) return { error: 'team_not_found' };
  }

  if (existingUserId) {
    const user = await User.findByPk(existingUserId);
    if (!user) return { error: 'invalid_code' };
    await user.update({ teamId: teamId || null });
    const userWithTeam = await User.findByPk(user.id, {
      include: [{ model: Team, as: 'team' }],
    });
    return { token: issueToken(userWithTeam), user: userWithTeam.toSafeJSON() };
  }

  const existing = await User.findOne({ where: { email: pending.email } });
  if (existing) {
    const provider = existing.authProvider || 'local';
    if (provider !== 'local' && provider !== pending.provider) {
      return { error: 'other_provider' };
    }
    const updates = {
      providerId: pending.providerId,
      emailVerified: true,
    };
    if (teamId && !existing.teamId) {
      updates.teamId = teamId;
    }
    await existing.update(updates);
    await applyGoogleProfileImage(existing, pending.picture);
    const userWithTeam = await User.findByPk(existing.id, {
      include: [{ model: Team, as: 'team' }],
    });
    return { token: issueToken(existing), user: userWithTeam.toSafeJSON() };
  }

  const registrationOpen = await getSetting('registrationEnabled', true);
  if (!registrationOpen) {
    return { error: 'registration_disabled' };
  }

  const newUser = await User.create({
    firstName: pending.firstName,
    lastName: pending.lastName,
    email: pending.email,
    password: randomUnusedPassword(),
    authProvider: pending.provider,
    providerId: pending.providerId,
    teamId: teamId || null,
    role: 'user',
    language: pending.language,
    emailVerified: true,
  });

  await applyGoogleProfileImage(newUser, pending.picture);

  const userWithTeam = await User.findByPk(newUser.id, {
    include: [{ model: Team, as: 'team' }],
  });

  return { token: issueToken(newUser), user: userWithTeam.toSafeJSON() };
}

function resetOAuthStateForTests() {
  pendingStates.clear();
  exchangeCodes.clear();
  googleClient = null;
}

module.exports = {
  isGoogleEnabled,
  getGoogleProviderStatus,
  startGoogleAuth,
  handleGoogleCallback,
  findOrCreateSsoUser,
  completeSsoRegistration,
  createExchangeCode,
  consumeExchangeCode,
  peekExchangeCode,
  isEmailDomainAllowed,
  getAppUrl,
  resetOAuthStateForTests,
};
