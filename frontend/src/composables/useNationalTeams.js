import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import { useFormatters } from './useFormatters';
import { useHeadToHead } from './useHeadToHead';

export function useNationalTeams() {
  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const { formatDate, formatTime } = useFormatters();

  const activeTab = ref('teams');
  const teams = ref([]);
  const selectedTeam = ref(null);
  const standings = ref([]);
  const scorers = ref([]);
  const liveMatches = ref([]);
  const loadingTeams = ref(true);
  const loadingTeamDetail = ref(false);
  const resolvingPlayerImages = ref(false);
  const loadingStandings = ref(false);
  const loadingScorers = ref(false);
  const loadingLive = ref(false);
  const error = ref('');
  const search = ref('');
  const liveFilter = ref('today');
  const duelTeamAId = ref(null);
  const duelTeamBId = ref(null);

  const {
    data: duelData,
    loading: duelLoading,
    loadForTeams: loadDuelHead2Head,
    reset: resetDuelHead2Head,
  } = useHeadToHead();

  let teamDetailAbort = null;
  let imageResolveAbort = null;

  function cancelTeamRequests() {
    teamDetailAbort?.abort();
    imageResolveAbort?.abort();
    teamDetailAbort = null;
    imageResolveAbort = null;
  }

  function isRequestCanceled(err) {
    return err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError';
  }

  function wait(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });
  }

  const tabs = computed(() => [
    { id: 'teams', label: t('nationalTeams.tabs.teams') },
    { id: 'standings', label: t('nationalTeams.tabs.standings') },
    { id: 'scorers', label: t('nationalTeams.tabs.scorers') },
    { id: 'live', label: t('nationalTeams.tabs.live') },
    { id: 'duels', label: t('nationalTeams.tabs.duels') },
  ]);

  const matchFilters = computed(() => [
    { value: 'today', label: t('nationalTeams.liveFilters.today') },
    { value: 'scheduled', label: t('nationalTeams.liveFilters.scheduled') },
    { value: 'live', label: t('nationalTeams.liveFilters.live') },
    { value: 'finished', label: t('nationalTeams.liveFilters.finished') },
  ]);

  const filteredTeams = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return teams.value;
    return teams.value.filter((team) => (
      team.name.toLowerCase().includes(q)
      || team.shortName?.toLowerCase().includes(q)
      || team.tla?.toLowerCase().includes(q)
    ));
  });

  const squadGroups = computed(() => {
    if (!selectedTeam.value?.squad?.length) return [];
    const order = ['Goalkeeper', 'Defence', 'Midfield', 'Offence', 'Offense'];
    const grouped = new Map();
    for (const player of selectedTeam.value.squad) {
      const pos = player.position || 'Other';
      if (!grouped.has(pos)) grouped.set(pos, []);
      grouped.get(pos).push(player);
    }
    const groups = [...grouped.entries()].map(([position, players]) => ({
      position,
      players: players.sort((a, b) => a.name.localeCompare(b.name)),
    }));
    groups.sort((a, b) => {
      const ai = order.indexOf(a.position);
      const bi = order.indexOf(b.position);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return groups;
  });

  const missingPlayerImages = computed(() => (
    selectedTeam.value?.squad?.filter((player) => !player.imageUrl).length || 0
  ));

  const squadImageProgress = computed(() => {
    const squad = selectedTeam.value?.squad || [];
    const total = squad.length;
    const withImage = squad.filter((player) => player.imageUrl).length;
    const percent = total ? Math.min(100, Math.round((withImage / total) * 100)) : 0;
    return {
      total,
      withImage,
      missing: total - withImage,
      percent,
    };
  });

  const canCompareDuels = computed(() => (
    duelTeamAId.value
    && duelTeamBId.value
    && duelTeamAId.value !== duelTeamBId.value
  ));

  function teamNameById(id) {
    return teams.value.find((team) => team.id === id)?.name || null;
  }

  async function compareDuels() {
    if (!canCompareDuels.value) return;
    await loadDuelHead2Head(duelTeamAId.value, duelTeamBId.value, {
      teamAName: teamNameById(duelTeamAId.value),
      teamBName: teamNameById(duelTeamBId.value),
    });
  }

  function positionLabel(position) {
    const key = {
      Goalkeeper: 'goalkeeper',
      Defence: 'defence',
      Midfield: 'midfield',
      Offence: 'offence',
      Offense: 'offence',
    }[position];
    return key ? t(`nationalTeams.positions.${key}`) : position;
  }

  function standingTitle(block) {
    if (block.group) return `${t('nationalTeams.group')} ${block.group}`;
    if (block.type === 'TOTAL') return t('nationalTeams.overallTable');
    return block.stage || block.type || t('nationalTeams.tabs.standings');
  }

  function formatBirthDate(value) {
    if (!value) return '–';
    return formatDate(value);
  }

  function formatDateTime(value) {
    if (!value) return '–';
    return `${formatDate(value)} ${formatTime(value)}`;
  }

  function findTeamInList(name) {
    const key = String(name || '').trim().toLowerCase();
    if (!key) return null;
    return teams.value.find((item) => (
      item.name.toLowerCase() === key
      || item.shortName?.toLowerCase() === key
      || item.tla?.toLowerCase() === key
    )) || null;
  }

  function applyTeamDetail(data) {
    if (!data?.id || !Array.isArray(data.squad) || !data.squad.length) return false;
    selectedTeam.value = data;
    return true;
  }

  function mergeTeamImageUpdates(data) {
    if (!data?.id || selectedTeam.value?.id !== data.id || !Array.isArray(data.squad) || !data.squad.length) {
      return;
    }
    const byId = new Map(data.squad.map((player) => [player.id, player]));
    selectedTeam.value = {
      ...selectedTeam.value,
      squad: selectedTeam.value.squad.map((player) => {
        const updated = byId.get(player.id);
        if (!updated) return player;
        return {
          ...player,
          imageUrl: updated.imageUrl || player.imageUrl,
          imageSource: updated.imageSource || player.imageSource,
          imageAttribution: updated.imageAttribution || player.imageAttribution,
          imageLicense: updated.imageLicense || player.imageLicense,
        };
      }),
    };
  }

  async function loadTeams() {
    loadingTeams.value = true;
    error.value = '';
    try {
      const { data } = await api.get('/football/teams');
      teams.value = data;
      const teamQuery = route.query.team;
      if (teamQuery) {
        const match = findTeamInList(teamQuery);
        if (match) await selectTeam(match, { replaceRoute: false });
      }
    } catch (err) {
      error.value = err.response?.data?.error || t('nationalTeams.loadFailed');
    } finally {
      loadingTeams.value = false;
    }
  }

  async function loadTeamDetail(team) {
    teamDetailAbort?.abort();
    const controller = new AbortController();
    teamDetailAbort = controller;

    loadingTeamDetail.value = true;
    error.value = '';
    try {
      const { data } = await api.get(`/football/teams/${team.id}`, {
        signal: controller.signal,
        timeout: 30000,
      });
      if (controller.signal.aborted) return;
      if (!applyTeamDetail(data)) {
        error.value = t('nationalTeams.squadEmpty');
      }
    } catch (err) {
      if (isRequestCanceled(err)) return;
      error.value = err.response?.data?.error || t('nationalTeams.loadFailed');
    } finally {
      if (teamDetailAbort === controller) {
        loadingTeamDetail.value = false;
      }
    }
  }

  async function loadPlayerImages() {
    if (!selectedTeam.value?.id || resolvingPlayerImages.value) return;
    resolvingPlayerImages.value = true;
    resolveTeamImagesInBackground(selectedTeam.value.id).finally(() => {
      resolvingPlayerImages.value = false;
    });
  }

  async function resolveTeamImagesInBackground(teamId) {
    imageResolveAbort?.abort();
    const controller = new AbortController();
    imageResolveAbort = controller;

    const maxRounds = 10;
    for (let round = 0; round < maxRounds; round += 1) {
      if (controller.signal.aborted || selectedTeam.value?.id !== teamId) return;

      const missing = selectedTeam.value?.squad?.filter((p) => !p.imageUrl).length || 0;
      if (missing === 0) return;

      try {
        if (round > 0) {
          await wait(800, controller.signal);
        }

        const { data } = await api.get(`/football/teams/${teamId}`, {
          params: { resolveImages: '1', maxResolve: 2 },
          signal: controller.signal,
          timeout: 20000,
        });
        if (controller.signal.aborted || selectedTeam.value?.id !== teamId) return;

        mergeTeamImageUpdates(data);
        if (data.imageResolve?.complete || (data.imageResolve?.resolvedThisRequest || 0) === 0) {
          return;
        }
      } catch (err) {
        if (isRequestCanceled(err)) return;
        return;
      }
    }
  }

  async function selectTeam(team, { replaceRoute = true } = {}) {
    cancelTeamRequests();
    resolvingPlayerImages.value = false;
    error.value = '';
    selectedTeam.value = {
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      tla: team.tla,
      crest: team.crest,
      squadSize: team.squadSize,
      squad: [],
    };
    await loadTeamDetail(team);
    if (replaceRoute) {
      router.replace({ query: { ...route.query, team: team.name, tab: 'teams' } });
    }
  }

  async function loadStandings() {
    loadingStandings.value = true;
    error.value = '';
    try {
      const { data } = await api.get('/football/standings');
      standings.value = data;
    } catch (err) {
      error.value = err.response?.data?.error || t('nationalTeams.loadFailed');
    } finally {
      loadingStandings.value = false;
    }
  }

  async function loadScorers() {
    loadingScorers.value = true;
    error.value = '';
    try {
      const { data } = await api.get('/football/scorers', { params: { limit: 20 } });
      scorers.value = data;
    } catch (err) {
      error.value = err.response?.data?.error || t('nationalTeams.loadFailed');
    } finally {
      loadingScorers.value = false;
    }
  }

  async function loadLiveMatches() {
    loadingLive.value = true;
    error.value = '';
    try {
      const today = new Date().toISOString().slice(0, 10);
      const params = liveFilter.value === 'today'
        ? { dateFrom: today, dateTo: today }
        : { status: liveFilter.value.toUpperCase(), limit: 50 };
      const { data } = await api.get('/football/matches', { params });
      liveMatches.value = data;
    } catch (err) {
      error.value = err.response?.data?.error || t('nationalTeams.loadFailed');
    } finally {
      loadingLive.value = false;
    }
  }

  function setLiveFilter(value) {
    liveFilter.value = value;
    loadLiveMatches();
  }

  async function switchTab(tabId) {
    activeTab.value = tabId;
    router.replace({ query: { ...route.query, tab: tabId } });
    if (tabId === 'standings' && !standings.value.length) await loadStandings();
    if (tabId === 'scorers' && !scorers.value.length) await loadScorers();
    if (tabId === 'live' && !liveMatches.value.length) await loadLiveMatches();
    if (tabId !== 'duels') resetDuelHead2Head();
  }

  async function retryLoad() {
    error.value = '';
    if (activeTab.value === 'teams') {
      await loadTeams();
      return;
    }
    if (activeTab.value === 'standings') {
      await loadStandings();
      return;
    }
    if (activeTab.value === 'scorers') {
      await loadScorers();
      return;
    }
    if (activeTab.value === 'live') {
      await loadLiveMatches();
    }
  }

  watch(() => route.query.team, async (name) => {
    if (!name || loadingTeams.value) return;
    const match = findTeamInList(name);
    if (match && selectedTeam.value?.id !== match.id) {
      await selectTeam(match, { replaceRoute: false });
    }
  });

  onMounted(async () => {
    if (route.query.tab) activeTab.value = String(route.query.tab);
    await loadTeams();
    if (activeTab.value === 'standings') await loadStandings();
    if (activeTab.value === 'scorers') await loadScorers();
    if (activeTab.value === 'live') await loadLiveMatches();
  });

  onUnmounted(() => {
    cancelTeamRequests();
  });

  return {
    activeTab,
    teams,
    selectedTeam,
    standings,
    scorers,
    liveMatches,
    loadingTeams,
    loadingTeamDetail,
    resolvingPlayerImages,
    loadingStandings,
    loadingScorers,
    loadingLive,
    error,
    search,
    liveFilter,
    duelTeamAId,
    duelTeamBId,
    duelData,
    duelLoading,
    tabs,
    matchFilters,
    filteredTeams,
    squadGroups,
    missingPlayerImages,
    squadImageProgress,
    canCompareDuels,
    selectTeam,
    loadPlayerImages,
    switchTab,
    setLiveFilter,
    compareDuels,
    positionLabel,
    standingTitle,
    formatBirthDate,
    formatDateTime,
    retryLoad,
  };
}
