const { resolveVenueImageFromStadium } = require('../data/wm2026Venues');

function attachStadiumImage(match) {
  if (!match || typeof match !== 'object') return match;
  const stadiumImageUrl = resolveVenueImageFromStadium(match.stadium);
  if (!stadiumImageUrl) return match;
  return { ...match, stadiumImageUrl };
}

function attachStadiumImages(matches) {
  return matches.map(attachStadiumImage);
}

module.exports = {
  attachStadiumImage,
  attachStadiumImages,
};
