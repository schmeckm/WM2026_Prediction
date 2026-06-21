const { extractYoutubeId, buildYoutubeWatchUrl } = require('../utils/youtubeUrl');
const { fetchVideoDetailsByIds } = require('./youtubeHighlightsService');

function metaFromSearchItem(item) {
  if (!item?.videoId && !item?.url) return null;
  const videoId = item.videoId || extractYoutubeId(item.url);
  if (!videoId) return null;

  return {
    videoId,
    title: item.title || null,
    channelTitle: item.channelTitle || null,
    channelId: item.channelId || null,
    viewCount: Number.isFinite(item.viewCount) ? item.viewCount : null,
    publishedAt: item.publishedAt || null,
    thumbnailUrl: item.thumbnailUrl || null,
    embeddable: typeof item.embeddable === 'boolean' ? item.embeddable : null,
    preferred: !!item.preferred,
    source: item.source || 'youtube_search',
    fetchedAt: new Date().toISOString(),
    url: item.url || buildYoutubeWatchUrl(videoId),
  };
}

function serializeHighlightsMeta(meta) {
  if (!meta) return null;
  return JSON.stringify(meta);
}

function parseHighlightsMeta(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      videoId: parsed.videoId || null,
      title: parsed.title || null,
      channelTitle: parsed.channelTitle || null,
      channelId: parsed.channelId || null,
      viewCount: Number.isFinite(parsed.viewCount) ? parsed.viewCount : null,
      publishedAt: parsed.publishedAt || null,
      thumbnailUrl: parsed.thumbnailUrl || null,
      embeddable: typeof parsed.embeddable === 'boolean' ? parsed.embeddable : null,
      preferred: !!parsed.preferred,
      source: parsed.source || null,
      fetchedAt: parsed.fetchedAt || null,
      url: parsed.url || null,
    };
  } catch {
    return null;
  }
}

function attachHighlightsMeta(match) {
  if (!match || typeof match !== 'object') return match;
  const meta = parseHighlightsMeta(match.highlightsMetaJson);
  const { highlightsMetaJson, ...rest } = match;
  return { ...rest, highlightsMeta: meta };
}

function attachHighlightsMetaList(matches) {
  return matches.map(attachHighlightsMeta);
}

async function fetchMetaForUrl(url) {
  const videoId = extractYoutubeId(url);
  if (!videoId) return null;

  const rows = await fetchVideoDetailsByIds([videoId]);
  const row = rows[0];
  if (!row) return null;

  return metaFromSearchItem({ ...row, source: 'youtube_videos_api' });
}

async function resolveHighlightsMetaForUpdate({ highlightsUrl, highlightsMeta }) {
  if (!highlightsUrl) return null;
  if (highlightsMeta && typeof highlightsMeta === 'object') {
    return serializeHighlightsMeta(metaFromSearchItem(highlightsMeta) || highlightsMeta);
  }
  const fetched = await fetchMetaForUrl(highlightsUrl);
  return serializeHighlightsMeta(fetched);
}

module.exports = {
  metaFromSearchItem,
  serializeHighlightsMeta,
  parseHighlightsMeta,
  attachHighlightsMeta,
  attachHighlightsMetaList,
  fetchMetaForUrl,
  resolveHighlightsMetaForUpdate,
};
