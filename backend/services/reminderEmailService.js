const emailService = require('./emailService');
const { getAppUrl } = require('./authTokenService');
const { t, resolveUserEmailLocale } = require('./i18nService');
const { escapeHtml, wrapBrandedEmail } = require('./emailLayoutService');
const {
  formatMarketProbabilitiesLine,
  formatBookmakerProbabilitiesLine,
  formatBookmakerFavoriteLine,
} = require('../utils/marketOddsFormat');

const DATE_LOCALES = {
  de: 'de-DE',
  // Use en-US so the default time format is typically AM/PM (clearer for English recipients).
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  pt: 'pt-PT',
  pl: 'pl-PL',
  tr: 'tr-TR',
};

function formatKickoff(kickoffTime, locale, { timezone } = {}) {
  const date = new Date(kickoffTime);
  const tz = timezone || process.env.REMINDER_TIMEZONE || process.env.DEFAULT_TIMEZONE || 'Europe/Zurich';
  const localeTag = DATE_LOCALES[locale] || DATE_LOCALES.de;
  return new Intl.DateTimeFormat(localeTag, {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatMatchOddsLines(m, locale, { includeMarketOdds = false, bookmakerStyle = false } = {}) {
  if (!includeMarketOdds) return { marketLine: '', favoriteLine: '' };
  if (bookmakerStyle) {
    return {
      marketLine: formatBookmakerProbabilitiesLine(m, locale),
      favoriteLine: formatBookmakerFavoriteLine(m, locale),
    };
  }
  return {
    marketLine: formatMarketProbabilitiesLine(m, locale),
    favoriteLine: '',
  };
}

function formatMatchListHtml(matches, locale, {
  timezone, includeMarketOdds = false, bookmakerStyle = false,
} = {}) {
  if (!matches.length) {
    return `<p style="margin:0;">${escapeHtml(t('emails.missingPredictions.noneUpcoming', locale))}</p>`;
  }
  const items = matches.map((m) => {
    const when = formatKickoff(m.kickoffTime, locale, { timezone });
    const { marketLine, favoriteLine } = formatMatchOddsLines(m, locale, { includeMarketOdds, bookmakerStyle });
    const marketHtml = marketLine
      ? `<br><span style="color:${bookmakerStyle ? '#cbd5e1' : '#64748b'};font-size:${bookmakerStyle ? '14px' : '13px'};">${escapeHtml(marketLine)}</span>`
      : (bookmakerStyle
        ? `<br><span style="color:#94a3b8;font-size:13px;">${escapeHtml(t('emails.bookmakerNoOdds', locale))}</span>`
        : '');
    const favoriteHtml = favoriteLine
      ? `<br><span style="color:#e2e8f0;font-size:13px;font-weight:600;">${escapeHtml(favoriteLine)}</span>`
      : '';
    return `<li>${escapeHtml(m.homeTeam)} vs ${escapeHtml(m.awayTeam)} – ${escapeHtml(when)}${marketHtml}${favoriteHtml}</li>`;
  }).join('');
  return `<ul style="margin:12px 0;padding-left:20px;">${items}</ul>`;
}

function formatMatchListText(matches, locale, {
  timezone, includeMarketOdds = false, bookmakerStyle = false,
} = {}) {
  if (!matches.length) return t('emails.missingPredictions.noneUpcoming', locale);
  return matches.map((m) => {
    const when = formatKickoff(m.kickoffTime, locale, { timezone });
    const { marketLine, favoriteLine } = formatMatchOddsLines(m, locale, { includeMarketOdds, bookmakerStyle });
    const oddsParts = [marketLine, favoriteLine].filter(Boolean);
    const suffix = oddsParts.length
      ? ` – ${oddsParts.join(' · ')}`
      : (bookmakerStyle ? ` – ${t('emails.bookmakerNoOdds', locale)}` : '');
    return `- ${m.homeTeam} vs ${m.awayTeam} (${when})${suffix}`;
  }).join('\n');
}

function templateMissingPredictions(user, missingCount, upcomingMatches) {
  const locale = resolveUserEmailLocale(user);
  const link = `${getAppUrl()}/matches?filter=missing`;
  const greeting = t('emails.missingPredictions.greeting', locale, { firstName: user.firstName });
  const body = t('emails.missingPredictions.body', locale, { missingCount });
  const upcomingHeading = t('emails.missingPredictions.upcomingHeading', locale);
  const matchListHtml = formatMatchListHtml(upcomingMatches, locale);
  const matchListText = formatMatchListText(upcomingMatches, locale);
  const cta = t('emails.missingPredictions.cta', locale);
  const fallback = t('emails.missingPredictions.fallback', locale, { link });

  return {
    subject: t('emails.missingPredictions.subject', locale, { missingCount }),
    html: wrapBrandedEmail({
      locale,
      title: t('emails.missingPredictions.title', locale),
      greeting,
      bodyHtml: `
        <p style="margin:0 0 12px;">${escapeHtml(body)}</p>
        <p style="margin:0 0 8px;font-weight:600;">${escapeHtml(upcomingHeading)}</p>
        ${matchListHtml}
      `.trim(),
      ctaHref: link,
      ctaLabel: cta,
      footerHtml: `<p style="margin:0;font-size:12px;">${escapeHtml(fallback).replace(escapeHtml(link), `<a href="${escapeHtml(link)}" style="color:#ffffff;text-decoration:underline;">${escapeHtml(link)}</a>`)}</p>`,
    }),
    text: t('emails.missingPredictions.text', locale, {
      firstName: user.firstName,
      missingCount,
      matchListText,
      link,
    }),
    locale,
  };
}

function buildMissingPredictionsNotification(user, missingCount) {
  const locale = resolveUserEmailLocale(user);
  return {
    title: t('emails.missingPredictions.notificationTitle', locale),
    message: t('emails.missingPredictions.notificationBody', locale, { missingCount }),
    locale,
  };
}

async function sendMissingPredictionsEmail(user, missingCount, upcomingMatches) {
  const template = templateMissingPredictions(user, missingCount, upcomingMatches);
  await emailService.sendEmail({ to: user.email, ...template });
  return template;
}

module.exports = {
  formatMatchListHtml,
  formatMatchListText,
  templateMissingPredictions,
  buildMissingPredictionsNotification,
  sendMissingPredictionsEmail,
};
