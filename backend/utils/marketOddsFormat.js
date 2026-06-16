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

function formatBookmakerProbabilitiesLine(match, locale) {
  const probs = getMarketProbabilities(match);
  if (!probs) return '';
  return t('emails.bookmakerProbabilities', locale, {
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    home: probs.home,
    draw: probs.draw,
    away: probs.away,
  });
}

function formatBookmakerFavoriteLine(match, locale) {
  const probs = getMarketProbabilities(match);
  if (!probs) return '';
  const options = [
    { key: 'home', team: match.homeTeam, value: Number(probs.home) },
    { key: 'draw', team: null, value: Number(probs.draw) },
    { key: 'away', team: match.awayTeam, value: Number(probs.away) },
  ].filter((entry) => Number.isFinite(entry.value));
  if (!options.length) return '';
  const favorite = options.sort((a, b) => b.value - a.value)[0];
  const percent = favorite.value.toFixed(1);
  if (favorite.key === 'draw') {
    return t('emails.bookmakerFavoriteDraw', locale, { percent });
  }
  return t('emails.bookmakerFavorite', locale, { team: favorite.team, percent });
}

module.exports = {
  getMarketProbabilities,
  formatMarketProbabilitiesLine,
  formatBookmakerProbabilitiesLine,
  formatBookmakerFavoriteLine,
};
