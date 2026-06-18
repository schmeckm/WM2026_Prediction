const KNOCKOUT_STAGE_KEYS = [
  'LAST_32',
  'LAST_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
];

const KNOCKOUT_STAGE_BONUSES = {
  LAST_32: { exact: 0, goalDifference: 0, tendency: 0 },
  LAST_16: { exact: 1, goalDifference: 1, tendency: 1 },
  QUARTER_FINALS: { exact: 2, goalDifference: 2, tendency: 2 },
  SEMI_FINALS: { exact: 4, goalDifference: 3, tendency: 2 },
  THIRD_PLACE: { exact: 2, goalDifference: 2, tendency: 2 },
  FINAL: { exact: 6, goalDifference: 5, tendency: 4 },
};

function resolveKnockoutTier(stage) {
  if (!stage || typeof stage !== 'string') return null;

  const normalized = stage.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized.includes('GROUP')) return null;

  if (normalized.includes('QUARTER')) return 'QUARTER_FINALS';
  if (normalized.includes('SEMI')) return 'SEMI_FINALS';
  if (normalized.includes('THIRD')) return 'THIRD_PLACE';
  if (normalized === 'FINAL' || normalized.endsWith('_FINAL')) return 'FINAL';
  if (normalized.includes('LAST_32') || normalized.includes('ROUND_OF_32')) return 'LAST_32';
  if (normalized.includes('LAST_16') || normalized.includes('ROUND_OF_16')) return 'LAST_16';
  if (normalized.includes('_32')) return 'LAST_32';
  if (normalized.includes('_16')) return 'LAST_16';

  return null;
}

function buildDefaultKnockoutStagePoints(baseRules = {}) {
  const base = {
    exactResultPoints: baseRules.exactResultPoints ?? 4,
    goalDifferencePoints: baseRules.goalDifferencePoints ?? 3,
    tendencyPoints: baseRules.tendencyPoints ?? 2,
  };

  return Object.fromEntries(
    KNOCKOUT_STAGE_KEYS.map((key) => {
      const bonus = KNOCKOUT_STAGE_BONUSES[key];
      return [key, {
        exactResultPoints: base.exactResultPoints + bonus.exact,
        goalDifferencePoints: base.goalDifferencePoints + bonus.goalDifference,
        tendencyPoints: base.tendencyPoints + bonus.tendency,
      }];
    }),
  );
}

function normalizeStagePointEntry(entry, fallback) {
  if (!entry || typeof entry !== 'object') return { ...fallback };

  return {
    exactResultPoints: Number.isFinite(Number(entry.exactResultPoints))
      ? Math.max(0, parseInt(entry.exactResultPoints, 10))
      : fallback.exactResultPoints,
    goalDifferencePoints: Number.isFinite(Number(entry.goalDifferencePoints))
      ? Math.max(0, parseInt(entry.goalDifferencePoints, 10))
      : fallback.goalDifferencePoints,
    tendencyPoints: Number.isFinite(Number(entry.tendencyPoints))
      ? Math.max(0, parseInt(entry.tendencyPoints, 10))
      : fallback.tendencyPoints,
  };
}

function normalizeKnockoutStagePoints(rawPoints, baseRules = {}) {
  const defaults = buildDefaultKnockoutStagePoints(baseRules);
  const source = rawPoints && typeof rawPoints === 'object' ? rawPoints : {};

  return Object.fromEntries(
    KNOCKOUT_STAGE_KEYS.map((key) => [key, normalizeStagePointEntry(source[key], defaults[key])]),
  );
}

function resolveEffectiveScoringRules(scoringRules, stage) {
  const base = {
    exactResultPoints: scoringRules?.exactResultPoints ?? 4,
    goalDifferencePoints: scoringRules?.goalDifferencePoints ?? 3,
    tendencyPoints: scoringRules?.tendencyPoints ?? 2,
    wrongPredictionPoints: scoringRules?.wrongPredictionPoints ?? 0,
  };

  if (!scoringRules?.knockoutStagePointsEnabled) {
    return base;
  }

  const tier = resolveKnockoutTier(stage);
  if (!tier) return base;

  const stagePoints = normalizeKnockoutStagePoints(
    scoringRules.knockoutStagePoints,
    scoringRules,
  )[tier];

  return {
    ...base,
    ...stagePoints,
  };
}

module.exports = {
  KNOCKOUT_STAGE_KEYS,
  resolveKnockoutTier,
  buildDefaultKnockoutStagePoints,
  normalizeKnockoutStagePoints,
  resolveEffectiveScoringRules,
};
