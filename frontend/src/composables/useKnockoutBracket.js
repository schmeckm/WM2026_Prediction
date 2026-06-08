import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const STAGE_ORDER = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL', 'THIRD_PLACE'];

const STAGE_COLUMN = {
  LAST_32: 0,
  LAST_16: 1,
  QUARTER_FINALS: 2,
  SEMI_FINALS: 3,
  FINAL: 4,
  THIRD_PLACE: 4,
};

const LEFT_R32_ORDER = [73, 74, 75, 76, 77, 78, 79, 80];
const RIGHT_R32_ORDER = [81, 82, 83, 84, 85, 86, 87, 88];
const LEFT_HALF_ROOT = 101;
const RIGHT_HALF_ROOT = 102;

const ROW_UNIT = 52;
const COL_WIDTH = 188;
const NODE_HEIGHT = 72;

function parseChildSlots(homeSlot, awaySlot) {
  const children = [];
  for (const slot of [homeSlot, awaySlot]) {
    if (slot && /^[WL]\d+$/.test(slot)) {
      children.push(parseInt(slot.slice(1), 10));
    }
  }
  return children;
}

function buildHalfSet(root, childrenByMatch, seedOrder) {
  const set = new Set(seedOrder);
  const queue = [root];
  while (queue.length) {
    const current = queue.shift();
    if (!set.has(current)) set.add(current);
    const children = childrenByMatch.get(current) || [];
    for (const child of children) {
      if (!set.has(child)) queue.push(child);
    }
  }
  return set;
}

function buildChildrenMap(path) {
  const childrenByMatch = new Map();
  for (const match of path) {
    const children = parseChildSlots(match.homeSlot, match.awaySlot);
    if (children.length) {
      childrenByMatch.set(match.matchNumber, children);
    }
  }
  return childrenByMatch;
}

function assignRow(matchNumber, childrenByMatch, rowByMatch, leafOrder) {
  if (rowByMatch.has(matchNumber)) return rowByMatch.get(matchNumber);

  const leafIndex = leafOrder.indexOf(matchNumber);
  if (leafIndex >= 0) {
    const row = leafIndex * 2;
    rowByMatch.set(matchNumber, row);
    return row;
  }

  const children = childrenByMatch.get(matchNumber) || [];
  if (!children.length) {
    rowByMatch.set(matchNumber, 0);
    return 0;
  }

  const childRows = children.map((child) => assignRow(child, childrenByMatch, rowByMatch, leafOrder));
  const row = (Math.min(...childRows) + Math.max(...childRows)) / 2;
  rowByMatch.set(matchNumber, row);
  return row;
}

export function useKnockoutBracket(pathRef) {
  const { t } = useI18n();

  function formatSlot(slot) {
    if (!slot) return '–';
    if (slot.startsWith('W')) {
      return t('groupStandings.winnerOfMatch', { match: slot.slice(1) });
    }
    if (slot.startsWith('L')) {
      return t('tournamentBracket.loserOfMatch', { match: slot.slice(1) });
    }
    if (slot.startsWith('3_')) {
      const groups = slot.slice(2).split('').join(', ');
      return t('groupStandings.thirdFromGroups', { groups });
    }
    const groupPos = slot.match(/^([12])([A-L])$/);
    if (groupPos) {
      const position = groupPos[1] === '1' ? t('groupStandings.winner') : t('groupStandings.runnerUp');
      return `${position} ${t('nationalTeams.group')} ${groupPos[2]}`;
    }
    return slot;
  }

  function stageTitle(stage) {
    const keys = {
      LAST_32: 'groupStandings.roundOf32',
      LAST_16: 'groupStandings.roundOf16',
      QUARTER_FINALS: 'tournamentBracket.quarterFinals',
      SEMI_FINALS: 'tournamentBracket.semiFinals',
      FINAL: 'tournamentBracket.final',
      THIRD_PLACE: 'tournamentBracket.thirdPlace',
    };
    return t(keys[stage] || stage);
  }

  const layout = computed(() => {
    const path = pathRef.value || [];
    if (!path.length) return { nodes: [], connectors: [], width: 0, height: 0 };

    const childrenByMatch = buildChildrenMap(path);
    const leftHalfSet = buildHalfSet(LEFT_HALF_ROOT, childrenByMatch, LEFT_R32_ORDER);
    const rightHalfSet = buildHalfSet(RIGHT_HALF_ROOT, childrenByMatch, RIGHT_R32_ORDER);
    const rowByMatch = new Map();
    assignRow(LEFT_HALF_ROOT, childrenByMatch, rowByMatch, LEFT_R32_ORDER);
    assignRow(RIGHT_HALF_ROOT, childrenByMatch, rowByMatch, RIGHT_R32_ORDER);

    const maxRow = Math.max(
      ...[...rowByMatch.values()],
      (RIGHT_R32_ORDER.length - 1) * 2,
      (LEFT_R32_ORDER.length - 1) * 2,
    );

    const nodes = path.map((match) => {
      const leftSide = match.stage === 'FINAL' || match.stage === 'THIRD_PLACE'
        ? true
        : leftHalfSet.has(match.matchNumber) || !rightHalfSet.has(match.matchNumber);
      const baseCol = STAGE_COLUMN[match.stage] ?? 0;
      const col = match.stage === 'THIRD_PLACE'
        ? 4
        : leftSide
          ? baseCol
          : 8 - baseCol;
      const row = match.stage === 'FINAL'
        ? -2
        : match.stage === 'THIRD_PLACE'
          ? maxRow + 3
          : rowByMatch.get(match.matchNumber) ?? 0;

      return {
        ...match,
        col,
        row,
        left: col * COL_WIDTH,
        top: (row + (match.stage === 'FINAL' ? 0 : 1)) * ROW_UNIT,
        side: leftSide ? 'left' : 'right',
      };
    });

    const nodeByNumber = new Map(nodes.map((node) => [node.matchNumber, node]));
    const connectors = [];

    for (const node of nodes) {
      const children = childrenByMatch.get(node.matchNumber) || [];
      for (const childNumber of children) {
        const child = nodeByNumber.get(childNumber);
        if (!child) continue;

        const parentX = node.left + (node.side === 'left' ? 0 : COL_WIDTH);
        const parentY = node.top + NODE_HEIGHT / 2;
        const childX = child.left + (child.side === 'left' ? COL_WIDTH : 0);
        const childY = child.top + NODE_HEIGHT / 2;
        const midX = node.side === 'left'
          ? parentX - COL_WIDTH * 0.22
          : parentX + COL_WIDTH * 0.22;

        connectors.push({
          key: `${node.matchNumber}-${childNumber}`,
          d: `M ${parentX} ${parentY} H ${midX} V ${childY} H ${childX}`,
        });
      }
    }

    const minLeft = Math.min(...nodes.map((node) => node.left));
    const maxLeft = Math.max(...nodes.map((node) => node.left + COL_WIDTH));
    const minTop = Math.min(...nodes.map((node) => node.top));
    const maxTop = Math.max(...nodes.map((node) => node.top + NODE_HEIGHT));

    return {
      nodes,
      connectors,
      width: maxLeft - minLeft + 40,
      height: maxTop - minTop + 40,
      offsetX: -minLeft + 20,
      offsetY: -minTop + 20,
      colWidth: COL_WIDTH,
      nodeHeight: NODE_HEIGHT,
    };
  });

  const roundHeaders = computed(() => STAGE_ORDER.map((stage) => ({
    stage,
    title: stageTitle(stage),
    col: STAGE_COLUMN[stage],
  })));

  return {
    formatSlot,
    stageTitle,
    layout,
    roundHeaders,
    STAGE_ORDER,
  };
}
