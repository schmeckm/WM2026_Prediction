const CANONICAL_PROGRESS_OPTIONS = [
  'groupStage',
  'roundOf32',
  'roundOf16',
  'quarterFinal',
  'semiFinal',
  'final',
  'champion',
];

const LEGACY_TO_CANONICAL = {
  Gruppenphase: 'groupStage',
  'Letzte 32': 'roundOf32',
  'Round of 32': 'roundOf32',
  'Last 32': 'roundOf32',
  Achtelfinale: 'roundOf16',
  Viertelfinale: 'quarterFinal',
  Halbfinale: 'semiFinal',
  Finale: 'final',
  Weltmeister: 'champion',
  'Group stage': 'groupStage',
  'Round of 16': 'roundOf16',
  'Quarter-final': 'quarterFinal',
  'Semi-final': 'semiFinal',
  Final: 'final',
  Champion: 'champion',
};

function normalizeProgressOption(value) {
  if (!value) return value;
  if (CANONICAL_PROGRESS_OPTIONS.includes(value)) return value;
  return LEGACY_TO_CANONICAL[value] || value;
}

function normalizeProgressOptions(options) {
  if (!Array.isArray(options)) return options;
  return options.map(normalizeProgressOption);
}

module.exports = {
  CANONICAL_PROGRESS_OPTIONS,
  LEGACY_TO_CANONICAL,
  normalizeProgressOption,
  normalizeProgressOptions,
};
