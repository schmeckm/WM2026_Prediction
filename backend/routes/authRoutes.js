const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Team } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');
const { sendError, translate } = require('../utils/apiResponse');
const { normalizeLocale } = require('../services/i18nService');
const { getSetting } = require('../services/settingsService');
const { generateToken, expiresInHours } = require('../services/authTokenService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/authEmailService');
const emailService = require('../services/emailService');
const { blacklistToken } = require('../services/tokenBlacklistService');
const { validatePassword } = require('../utils/passwordValidation');
const { authLimiter } = require('../middleware/rateLimiter');
const {
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
} = require('../services/oauthService');

const router = express.Router();
const sensitiveAuthLimiter = process.env.NODE_ENV === 'test'
  ? (_req, _res, next) => next()
  : authLimiter;

async function isRegistrationOpen() {
  return getSetting('registrationEnabled', true);
}

function issueToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

function redirectWithSsoError(res, errorKey) {
  const appUrl = getAppUrl();
  res.redirect(`${appUrl}/login?ssoError=${encodeURIComponent(errorKey)}`);
}

function mapOAuthCallbackError(error) {
  const message = String(error?.message || error?.error || error?.oauthError || '').toLowerCase();
  if (/invalid_client|client authentication failed|unauthorized_client/.test(message)) {
    return 'sso_invalid_client';
  }
  if (/redirect_uri_mismatch/.test(message)) {
    return 'sso_redirect_mismatch';
  }
  if (/iss missing|invalid_grant|invalid_client|client authentication failed/.test(message)) {
    return 'sso_invalid_client';
  }
  if (/invalid_state|state mismatch/.test(message)) {
    return 'sso_failed';
  }
  return 'sso_failed';
}

router.get('/providers', (_req, res) => {
  res.json(getGoogleProviderStatus());
});

router.get('/google', async (req, res) => {
  try {
    if (!isGoogleEnabled()) {
      return sendError(res, req, 503, 'errors.ssoNotConfigured');
    }
    const locale = normalizeLocale(req.query.language || req.locale);
    const url = await startGoogleAuth(locale);
    res.redirect(url);
  } catch (error) {
    console.error('Google OAuth start error:', error);
    sendError(res, req, 500, 'errors.ssoFailed');
  }
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) {
      return redirectWithSsoError(res, 'sso_cancelled');
    }
    if (!code || !state) {
      return redirectWithSsoError(res, 'sso_failed');
    }

    const profile = await handleGoogleCallback(code, state);

    if (!profile.email || !profile.emailVerified) {
      return redirectWithSsoError(res, 'sso_email_not_verified');
    }
    if (!isEmailDomainAllowed(profile.email)) {
      return redirectWithSsoError(res, 'sso_domain_not_allowed');
    }

    const result = await findOrCreateSsoUser(profile, issueToken);

    if (result.error) {
      return redirectWithSsoError(res, result.error);
    }

    const exchangeCode = createExchangeCode(result);
    if (result.requiresTeam) {
      return res.redirect(`${getAppUrl()}/auth/complete-registration?code=${exchangeCode}`);
    }
    return res.redirect(`${getAppUrl()}/auth/callback?code=${exchangeCode}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    redirectWithSsoError(res, mapOAuthCallbackError(error));
  }
});

router.post('/exchange', sensitiveAuthLimiter, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return sendError(res, req, 400, 'errors.ssoInvalidCode');
    }

    const data = consumeExchangeCode(code);
    if (!data) {
      return sendError(res, req, 400, 'errors.ssoInvalidCode');
    }

    if (data.error) {
      const errorMap = {
        local_account_exists: 'errors.ssoLocalAccountExists',
        other_provider: 'errors.ssoOtherProvider',
        registration_disabled: 'errors.registrationDisabled',
      };
      return sendError(res, req, 403, errorMap[data.error] || 'errors.ssoFailed');
    }

    if (data.requiresTeam) {
      return sendError(res, req, 400, 'errors.ssoTeamRequired');
    }

    res.json({
      message: translate(req, 'messages.loginSuccess'),
      token: data.token,
      user: data.user,
    });
  } catch (error) {
    console.error('SSO exchange error:', error);
    sendError(res, req, 500, 'errors.ssoFailed');
  }
});

router.get('/sso-pending', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return sendError(res, req, 400, 'errors.ssoInvalidCode');
    }

    const data = peekExchangeCode(code);
    if (!data?.requiresTeam || !data.pending) {
      return sendError(res, req, 400, 'errors.ssoInvalidCode');
    }

    res.json({
      email: data.pending.email,
      firstName: data.pending.firstName,
      lastName: data.pending.lastName,
    });
  } catch (error) {
    sendError(res, req, 500, 'errors.ssoFailed');
  }
});

router.post('/complete-sso', sensitiveAuthLimiter, async (req, res) => {
  try {
    const { code, teamId } = req.body;
    if (!code) {
      return sendError(res, req, 400, 'errors.ssoInvalidCode');
    }

    const result = await completeSsoRegistration(code, teamId, issueToken);

    const errorMap = {
      invalid_code: 'errors.ssoInvalidCode',
      team_required: 'errors.teamRequiredOnRegistration',
      team_not_found: 'errors.teamNotExists',
      local_account_exists: 'errors.ssoLocalAccountExists',
      registration_disabled: 'errors.registrationDisabled',
    };

    if (result.error) {
      return sendError(res, req, 400, errorMap[result.error] || 'errors.ssoFailed');
    }

    res.json({
      message: translate(req, 'messages.loginSuccess'),
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('SSO complete error:', error);
    sendError(res, req, 500, 'errors.ssoFailed');
  }
});

router.post('/register', sensitiveAuthLimiter, async (req, res) => {
  try {
    const open = await isRegistrationOpen();
    if (!open) {
      return sendError(res, req, 403, 'errors.registrationDisabled');
    }

    const { firstName, lastName, email, password, passwordConfirm, teamId, language } = req.body;

    if (!firstName || !lastName || !email || !password || !passwordConfirm) {
      return sendError(res, req, 400, 'errors.registrationFieldsRequired');
    }

    if (password !== passwordConfirm) {
      return sendError(res, req, 400, 'errors.passwordsDoNotMatch');
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return sendError(res, req, 400, passwordCheck.errorKey);
    }

    const requireTeam = await getSetting('requireTeamOnRegistration', true);
    if (requireTeam && !teamId) {
      return sendError(res, req, 400, 'errors.teamRequiredOnRegistration');
    }

    const locale = normalizeLocale(language || req.locale);

    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return sendError(res, req, 409, 'errors.emailRegistered');
    }

    if (teamId) {
      const team = await Team.findByPk(teamId);
      if (!team) {
        return sendError(res, req, 400, 'errors.teamNotExists');
      }
    }

    const requireVerification = await getSetting('requireEmailVerification', true);
    const verificationToken = requireVerification ? generateToken() : null;

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      teamId: teamId || null,
      role: 'user',
      language: locale,
      emailVerified: !requireVerification,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationToken ? expiresInHours(24) : null,
    });

    let emailSent = false;
    if (requireVerification && verificationToken) {
      const result = await sendVerificationEmail(user, verificationToken);
      emailSent = !result.mock;
      if (result.mock) {
        console.log(`[Email mock] Verifizierung für ${user.email}: ${process.env.APP_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`);
      }
    }

    if (requireVerification) {
      return res.status(201).json({
        message: translate(req, 'messages.registrationVerifyEmail'),
        requiresVerification: true,
        emailSent,
        email: user.email,
      });
    }

    const userWithTeam = await User.findByPk(user.id, {
      include: [{ model: Team, as: 'team' }],
    });
    const token = issueToken(user);

    res.status(201).json({
      message: translate(req, 'messages.registrationSuccess'),
      requiresVerification: false,
      token,
      user: userWithTeam.toSafeJSON(),
    });
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, req, 500, 'errors.registrationFailed');
  }
});

router.post('/login', sensitiveAuthLimiter, async (req, res) => {
  try {
    const { email, password, language } = req.body;

    if (!email || !password) {
      return sendError(res, req, 400, 'errors.loginFieldsRequired');
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
      include: [{ model: Team, as: 'team' }],
    });

    if (!user) {
      return sendError(res, req, 401, 'errors.invalidCredentials');
    }

    if (user.authProvider && user.authProvider !== 'local') {
      return sendError(res, req, 401, 'errors.useSsoLogin');
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return sendError(res, req, 401, 'errors.invalidCredentials');
    }

    const requireVerification = await getSetting('requireEmailVerification', true);
    if (requireVerification && !user.emailVerified && user.role !== 'admin') {
      return sendError(res, req, 403, 'errors.emailNotVerified');
    }

    if (language) {
      const locale = normalizeLocale(language);
      if (normalizeLocale(user.language) !== locale) {
        await user.update({ language: locale });
      }
    }

    const token = issueToken(user);

    res.json({
      message: translate(req, 'messages.loginSuccess'),
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, req, 500, 'errors.loginFailed');
  }
});

router.post('/verify-email', sensitiveAuthLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return sendError(res, req, 400, 'errors.invalidVerificationToken');
    }

    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { [Op.gt]: new Date() },
      },
      include: [{ model: Team, as: 'team' }],
    });

    if (!user) {
      return sendError(res, req, 400, 'errors.invalidVerificationToken');
    }

    await user.update({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    const jwtToken = issueToken(user);

    res.json({
      message: translate(req, 'messages.emailVerified'),
      token: jwtToken,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error('Verify email error:', error);
    sendError(res, req, 500, 'errors.verificationFailed');
  }
});

router.post('/resend-verification', sensitiveAuthLimiter, async (req, res) => {
  try {
    const { email, language } = req.body;
    if (!email) {
      return sendError(res, req, 400, 'errors.loginFieldsRequired');
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user || user.emailVerified) {
      return res.json({ message: translate(req, 'messages.verificationEmailSent') });
    }

    const locale = normalizeLocale(language || req.locale);
    const token = generateToken();
    const updates = {
      emailVerificationToken: token,
      emailVerificationExpires: expiresInHours(24),
    };
    if (normalizeLocale(user.language) !== locale) {
      updates.language = locale;
    }
    await user.update(updates);

    const result = await sendVerificationEmail(user, token, locale);
    if (result.mock) {
      console.log(`[Email mock] Verifizierung erneut: ${process.env.APP_URL || 'http://localhost:5173'}/verify-email?token=${token}`);
    }

    res.json({
      message: translate(req, 'messages.verificationEmailSent'),
      emailSent: !result.mock,
    });
  } catch (error) {
    sendError(res, req, 500, 'errors.verificationFailed');
  }
});

router.post('/forgot-password', sensitiveAuthLimiter, async (req, res) => {
  try {
    const { email, language } = req.body;
    if (!email) {
      return sendError(res, req, 400, 'errors.loginFieldsRequired');
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (user) {
      const locale = normalizeLocale(language || req.locale);
      const token = generateToken();
      const updates = {
        passwordResetToken: token,
        passwordResetExpires: expiresInHours(1),
      };
      if (normalizeLocale(user.language) !== locale) {
        updates.language = locale;
      }
      await user.update(updates);
      const result = await sendPasswordResetEmail(user, token, locale);
      if (result.mock) {
        console.log(`[Email mock] Passwort-Reset: ${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`);
      }
    }

    res.json({ message: translate(req, 'messages.passwordResetSent') });
  } catch (error) {
    sendError(res, req, 500, 'errors.passwordResetFailed');
  }
});

router.post('/reset-password', sensitiveAuthLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return sendError(res, req, 400, 'errors.passwordResetFieldsRequired');
    }
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return sendError(res, req, 400, passwordCheck.errorKey);
    }

    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return sendError(res, req, 400, 'errors.invalidResetToken');
    }

    await user.update({
      password,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    res.json({ message: translate(req, 'messages.passwordResetSuccess') });
  } catch (error) {
    sendError(res, req, 500, 'errors.passwordResetFailed');
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      const decoded = jwt.decode(token);
      const expMs = decoded?.exp ? decoded.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
      await blacklistToken(token, expMs);
    }
    res.json({ message: translate(req, 'messages.logoutSuccess') });
  } catch (error) {
    sendError(res, req, 500, 'errors.logoutFailed');
  }
});

module.exports = router;
