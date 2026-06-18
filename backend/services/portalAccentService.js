const PORTAL_ACCENTS = [
  'green',
  'blue',
  'cyan',
  'orange',
  'purple',
  'pink',
  'red',
  'gold',
];

function normalizePortalAccent(value) {
  if (value == null || value === '') return 'green';
  const id = String(value).toLowerCase().trim();
  return PORTAL_ACCENTS.includes(id) ? id : 'green';
}

module.exports = { PORTAL_ACCENTS, normalizePortalAccent };
