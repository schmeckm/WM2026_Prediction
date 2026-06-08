const { getSetting, setSetting, normalizePrizes } = require('./settingsService');
const { deleteImageByUrl } = require('./prizeImageService');

async function getPrizes() {
  return getSetting('prizes', normalizePrizes([]));
}

async function setPrizeImageUrl(rank, imageUrl) {
  const prizes = normalizePrizes(await getPrizes());
  const index = prizes.findIndex((p) => p.rank === rank);
  if (index === -1) return null;

  const previousUrl = prizes[index].imageUrl;
  if (previousUrl && previousUrl !== imageUrl) {
    deleteImageByUrl(previousUrl);
  }

  prizes[index] = { ...prizes[index], imageUrl };
  await setSetting('prizes', prizes);
  return prizes;
}

async function clearPrizeImageUrl(rank) {
  const prizes = normalizePrizes(await getPrizes());
  const index = prizes.findIndex((p) => p.rank === rank);
  if (index === -1) return null;

  prizes[index] = { ...prizes[index], imageUrl: '' };
  await setSetting('prizes', prizes);
  return prizes;
}

module.exports = {
  getPrizes,
  setPrizeImageUrl,
  clearPrizeImageUrl,
};
