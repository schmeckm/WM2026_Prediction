export const BRACKET_GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function createEmptyGroupBlock(letter) {
  return {
    group: letter,
    type: 'TOTAL',
    stage: 'GROUP_STAGE',
    table: [],
    nextMatches: [],
    allMatches: [],
    empty: true,
  };
}

export function mergeBracketGroups(apiGroups = []) {
  const byLetter = new Map(
    apiGroups.map((block) => [String(block.group).trim().toUpperCase(), { ...block, empty: false }]),
  );

  return BRACKET_GROUP_LETTERS.map((letter) => byLetter.get(letter) || createEmptyGroupBlock(letter));
}

export function knockoutMatchRelatesToGroup(match, groupLetter) {
  if (!match || !groupLetter) return false;

  const group = String(groupLetter).trim().toUpperCase();
  const slots = [match.homeSlot, match.awaySlot].filter(Boolean);

  return slots.some((slot) => {
    const normalized = String(slot).trim().toUpperCase();
    const groupPosMatch = normalized.match(/^[12]([A-L])$/);
    if (groupPosMatch) return groupPosMatch[1] === group;
    if (normalized.startsWith('3_')) return normalized.slice(2).includes(group);
    return false;
  });
}
