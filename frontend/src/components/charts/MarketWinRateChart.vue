<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Bar } from 'vue-chartjs';
import { useThemeStore } from '../../stores/themeStore';
import {
  CHART_PRIMARY,
  CHART_PRIMARY_FILL,
  CHART_SECONDARY,
  CHART_SECONDARY_FILL,
  baseChartOptions,
} from '../../utils/chartTheme';
import { registerChart } from '../../utils/registerChart';

registerChart();

const props = defineProps({
  teams: { type: Array, default: () => [] },
});

const { t } = useI18n();
const themeStore = useThemeStore();

const chartData = computed(() => ({
  labels: props.teams.map((entry) => entry.team),
  datasets: [
    {
      label: t('nationalTeams.market.marketWinPct'),
      data: props.teams.map((entry) => entry.avgMarketWinPct ?? 0),
      backgroundColor: CHART_PRIMARY_FILL,
      borderColor: CHART_PRIMARY,
      borderWidth: 1,
    },
    {
      label: t('nationalTeams.market.actualWinPct'),
      data: props.teams.map((entry) => entry.actualWinPct ?? 0),
      backgroundColor: CHART_SECONDARY_FILL,
      borderColor: CHART_SECONDARY,
      borderWidth: 1,
    },
  ],
}));

const chartOptions = computed(() => baseChartOptions({
  theme: themeStore.theme,
  y: {
    beginAtZero: true,
    max: 100,
    ticks: {
      callback: (value) => `${value}%`,
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
    },
  },
}));
</script>
