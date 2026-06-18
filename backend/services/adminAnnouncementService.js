const { User } = require('../models');
const emailService = require('./emailService');
const notificationService = require('./notificationService');
const { getAppUrl } = require('./authTokenService');
const { t, resolveUserEmailLocale } = require('./i18nService');
const { escapeHtml, wrapBrandedEmail } = require('./emailLayoutService');

function buildAnnouncementEmail(user, { title, message, link }) {
  const locale = resolveUserEmailLocale(user);
  const appUrl = getAppUrl();
  const ctaHref = link ? `${appUrl}${link}` : appUrl;
  const ctaLabel = link
    ? t('emails.adminAnnouncement.ctaWithLink', locale)
    : t('emails.adminAnnouncement.cta', locale);
  const bodyParagraphs = String(message || '')
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => `<p style="margin:0 0 12px;">${escapeHtml(line)}</p>`)
    .join('');

  return {
    subject: t('emails.adminAnnouncement.subject', locale, { title }),
    html: wrapBrandedEmail({
      locale,
      title,
      greeting: t('emails.adminAnnouncement.greeting', locale, { firstName: user.firstName }),
      bodyHtml: bodyParagraphs || `<p style="margin:0;">${escapeHtml(message)}</p>`,
      ctaHref,
      ctaLabel,
      footerHtml: escapeHtml(t('emails.adminAnnouncement.footer', locale)),
    }),
    text: t('emails.adminAnnouncement.text', locale, {
      firstName: user.firstName,
      title,
      message,
      link: ctaHref,
    }),
  };
}

async function resolveRecipients({ userId, includeAdmins }) {
  if (userId) {
    const user = await User.findByPk(userId);
    return user ? [user] : [];
  }

  const where = includeAdmins ? {} : { role: 'user' };
  return User.findAll({ where, order: [['lastName', 'ASC'], ['firstName', 'ASC']] });
}

async function sendAdminAnnouncement({
  userId = null,
  title,
  message,
  type = 'info',
  link = null,
  sendInApp = true,
  sendEmail = false,
  showOnLogin = false,
  includeAdmins = false,
}) {
  if (!sendInApp && !sendEmail) {
    const error = new Error('no_delivery_channel');
    error.code = 'no_delivery_channel';
    throw error;
  }

  const recipients = await resolveRecipients({ userId, includeAdmins });
  if (recipients.length === 0) {
    const error = new Error('no_recipients');
    error.code = 'no_recipients';
    throw error;
  }

  let inAppSent = 0;
  let emailsSent = 0;
  let emailsSkipped = 0;

  const highlightOnLogin = sendInApp && showOnLogin;

  if (sendInApp) {
    const payload = recipients.map((user) => ({
      userId: user.id,
      title,
      message,
      type,
      link,
      showOnLogin: highlightOnLogin,
      isRead: false,
    }));

    if (payload.length === 1) {
      await notificationService.createNotification(payload[0]);
    } else {
      await notificationService.createBulkNotifications(payload);
    }
    inAppSent = payload.length;
  }

  if (sendEmail) {
    for (const user of recipients) {
      if (!user.email) {
        emailsSkipped += 1;
        continue;
      }
      const template = buildAnnouncementEmail(user, { title, message, link });
      await emailService.sendEmail({ to: user.email, ...template });
      emailsSent += 1;
    }
  }

  return {
    recipientCount: recipients.length,
    inAppSent,
    emailsSent,
    emailsSkipped,
  };
}

module.exports = {
  buildAnnouncementEmail,
  resolveRecipients,
  sendAdminAnnouncement,
};
