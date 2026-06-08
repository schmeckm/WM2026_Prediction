<template>
  <div class="tournament-bracket-tree">
    <div
      class="tournament-bracket-scaler"
      :style="scalerStyle"
    >
    <div class="tournament-bracket-round-headers" :style="{ width: `${layout.width}px` }">
      <span
        v-for="header in columnHeaders"
        :key="header.key"
        class="tournament-bracket-round-header"
        :style="{ left: `${header.left + layout.offsetX}px`, width: `${layout.colWidth}px` }"
      >
        {{ header.title }}
      </span>
    </div>
    <div
      class="tournament-bracket-canvas"
      :style="{
        width: `${layout.width}px`,
        height: `${layout.height}px`,
      }"
    >
      <svg
        class="tournament-bracket-lines"
        :width="layout.width"
        :height="layout.height"
        :viewBox="`0 0 ${layout.width} ${layout.height}`"
        aria-hidden="true"
      >
        <g :transform="`translate(${layout.offsetX}, ${layout.offsetY})`">
          <path
            v-for="line in layout.connectors"
            :key="line.key"
            :d="line.d"
            class="tournament-bracket-line"
          />
        </g>
      </svg>

      <div
        class="tournament-bracket-nodes"
        :style="{
          width: `${layout.width}px`,
          height: `${layout.height}px`,
          transform: `translate(${layout.offsetX}px, ${layout.offsetY}px)`,
        }"
      >
        <BracketMatchNode
          v-for="node in layout.nodes"
          :key="node.matchNumber"
          :match="node"
          :format-slot="formatSlot"
          :left="node.left"
          :top="node.top"
          :width="layout.colWidth"
          :clickable="clickable"
          :highlighted="isNodeHighlighted(node)"
          :dimmed="isNodeDimmed(node)"
        />
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { computed, toRef } from 'vue';
import { useKnockoutBracket } from '../../composables/useKnockoutBracket';
import { knockoutMatchRelatesToGroup } from '../../composables/useBracketGroupHighlight';
import BracketMatchNode from './BracketMatchNode.vue';

const props = defineProps({
  path: { type: Array, default: () => [] },
  zoom: { type: Number, default: 1 },
  clickable: { type: Boolean, default: true },
  highlightedGroup: { type: String, default: '' },
});

function isNodeHighlighted(node) {
  return !!props.highlightedGroup && knockoutMatchRelatesToGroup(node, props.highlightedGroup);
}

function isNodeDimmed(node) {
  return !!props.highlightedGroup && !isNodeHighlighted(node);
}

const { formatSlot, layout, stageTitle } = useKnockoutBracket(toRef(props, 'path'));

const scalerStyle = computed(() => {
  const scaledHeight = layout.value.height * props.zoom;
  return {
    transform: `scale(${props.zoom})`,
    transformOrigin: 'top center',
    width: `${layout.value.width}px`,
    height: `${layout.value.height}px`,
    marginBottom: `${Math.max(0, scaledHeight - layout.value.height)}px`,
  };
});

const columnHeaders = computed(() => {
  const { colWidth } = layout.value;
  const stages = [
    { key: 'left-r32', col: 0, stage: 'LAST_32' },
    { key: 'left-r16', col: 1, stage: 'LAST_16' },
    { key: 'left-qf', col: 2, stage: 'QUARTER_FINALS' },
    { key: 'left-sf', col: 3, stage: 'SEMI_FINALS' },
    { key: 'final', col: 4, stage: 'FINAL' },
    { key: 'right-sf', col: 5, stage: 'SEMI_FINALS' },
    { key: 'right-qf', col: 6, stage: 'QUARTER_FINALS' },
    { key: 'right-r16', col: 7, stage: 'LAST_16' },
    { key: 'right-r32', col: 8, stage: 'LAST_32' },
  ];
  return stages.map((entry) => ({
    key: entry.key,
    left: entry.col * colWidth,
    title: stageTitle(entry.stage),
  }));
});
</script>

<style scoped>
.tournament-bracket-tree {
  overflow: auto;
  padding-bottom: 0.5rem;
}

.tournament-bracket-scaler {
  margin: 0 auto;
}

.tournament-bracket-round-headers {
  position: relative;
  height: 1.35rem;
  margin: 0 auto 0.35rem;
  min-width: 100%;
}

.tournament-bracket-round-header {
  position: absolute;
  top: 0;
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tournament-bracket-canvas {
  position: relative;
  margin: 0 auto;
  min-width: 100%;
}

.tournament-bracket-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.tournament-bracket-line {
  fill: none;
  stroke: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  stroke-width: 1.5;
}

.tournament-bracket-nodes {
  position: relative;
}
</style>
