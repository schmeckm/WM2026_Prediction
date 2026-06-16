const { parseMarketOddsJson } = require('./matchMarketOdds');
const { t } = require('../services/i18nService');

function getMarketProbabilities(match) {
  const fromJson = parseMarketOddsJson(match?.marketOddsJson);
  if (fromJson?.probabilities) return fromJson.probabilities;
  return match?.marketOdds?.probabilities || null;
}

function formatMarketProbabilitiesLine(match, locale) {
  const probs = getMarketProbabilities(match);
  if (!probs) return '';
  return t('emails.marketProbabilities', locale, {
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    home: probs.home,
    draw: probs.draw,
    away: probs.away,
  });
}

module.exports = {
  getMarketProbabilities,
  formatMarketProbabilitiesLine,
};
