const MAX_TITLE = 120;
const MAX_MESSAGE = 1000;
const MAX_LINK = 255;
const SAFE_LINK = /^\/[a-zA-Z0-9/_-]*$/;

function validateNotificationPayload({
  title,
  message,
  link,
  type,
  userId,
  sendInApp,
  sendEmail,
  showOnLogin,
  includeAdmins,
}) {
  const errors = [];

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('title');
  } else if (title.trim().length > MAX_TITLE) {
    errors.push('title_length');
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    errors.push('message');
  } else if (message.trim().length > MAX_MESSAGE) {
    errors.push('message_length');
  }

  if (link != null && link !== '') {
    if (typeof link !== 'string' || !SAFE_LINK.test(link.trim()) || link.trim().length > MAX_LINK) {
      errors.push('link');
    }
  }

  const allowedTypes = new Set(['info', 'success', 'warning', 'error']);
  if (type && !allowedTypes.has(type)) {
    errors.push('type');
  }

  let parsedUserId = null;
  if (userId != null && userId !== '') {
    const numericUserId = Number.parseInt(userId, 10);
    if (!Number.isFinite(numericUserId) || numericUserId < 1) {
      errors.push('userId');
    } else {
      parsedUserId = numericUserId;
    }
  }

  const resolvedSendInApp = sendInApp !== false;
  const resolvedSendEmail = sendEmail === true;
  if (!resolvedSendInApp && !resolvedSendEmail) {
    errors.push('delivery_channel');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      title: String(title || '').trim().slice(0, MAX_TITLE),
      message: String(message || '').trim().slice(0, MAX_MESSAGE),
      link: link ? String(link).trim().slice(0, MAX_LINK) : null,
      type: allowedTypes.has(type) ? type : 'info',
      userId: parsedUserId,
      sendInApp: resolvedSendInApp,
      sendEmail: resolvedSendEmail,
      showOnLogin: resolvedSendInApp && showOnLogin === true,
      includeAdmins: includeAdmins === true,
    },
  };
}

module.exports = { validateNotificationPayload };
