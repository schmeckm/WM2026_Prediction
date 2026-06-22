const DEFAULT_PREFERRED_CHANNEL_IDS = [
  'UC6c1z7bA__85CIWZ_jpCK-Q', // ESPN FC
  'UCNAf1k0yIjyGu3k9BwAg3lg', // Sky Sports Premier League
];
const DEFAULT_PREFERRED_CHANNEL_KEYWORDS = ['espn fc', 'sky sports'];
const DEFAULT_SKIP_CHANNEL_KEYWORDS = ['fifa', 'fox soccer', 'fox sports'];
const DEFAULT_REGION_CODE = 'CH';
const DEFAULT_RELEVANCE_LANGUAGE = 'en';

function getYouTubeApiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : '';
}

function parseCsv(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getSkipChannelKeywords() {
  if (process.env.YOUTUBE_SKIP_CHANNEL_KEYWORDS === '') return [];
  const fromEnv = parseCsv(process.env.YOUTUBE_SKIP_CHANNEL_KEYWORDS)
    .map((s) => s.toLowerCase());
  if (fromEnv.length) return fromEnv;
  return [...DEFAULT_SKIP_CHANNEL_KEYWORDS];
}

function getSkipChannelIds() {
  return parseCsv(process.env.YOUTUBE_SKIP_CHANNEL_IDS || '');
}

function getPreferredChannelIds() {
  if (process.env.YOUTUBE_PREFERRED_CHANNEL_IDS === '') return [];
  const fromEnv = parseCsv(process.env.YOUTUBE_PREFERRED_CHANNEL_IDS);
  if (fromEnv.length) return fromEnv;
  return [...DEFAULT_PREFERRED_CHANNEL_IDS];
}

function getPreferredChannelKeywords() {
  if (process.env.YOUTUBE_PREFERRED_CHANNEL_KEYWORDS === '') return [];
  const fromEnv = parseCsv(process.env.YOUTUBE_PREFERRED_CHANNEL_KEYWORDS)
    .map((s) => s.toLowerCase());
  if (fromEnv.length) return fromEnv;
  return [...DEFAULT_PREFERRED_CHANNEL_KEYWORDS];
}

function getRegionCode() {
  const code = String(process.env.YOUTUBE_REGION_CODE || DEFAULT_REGION_CODE).trim().toUpperCase();
  // YouTube uses ISO 3166-1 alpha-2 country codes (e.g. DE, CH, US)
  return /^[A-Z]{2}$/.test(code) ? code : DEFAULT_REGION_CODE;
}

function getRelevanceLanguage() {
  if (process.env.YOUTUBE_RELEVANCE_LANGUAGE === '') return '';
  const lang = String(process.env.YOUTUBE_RELEVANCE_LANGUAGE || DEFAULT_RELEVANCE_LANGUAGE)
    .trim()
    .toLowerCase();
  return /^[a-z]{2}$/.test(lang) ? lang : DEFAULT_RELEVANCE_LANGUAGE;
}

function isBlockedInRegion(regionCode, videoDetails) {
  if (!regionCode) return false;
  const rr = videoDetails?.contentDetails?.regionRestriction;
  const blocked = Array.isArray(rr?.blocked) ? rr?.blocked : null;
  const allowed = Array.isArray(rr?.allowed) ? rr?.allowed : null;
  if (blocked?.includes?.(regionCode)) return true;
  if (allowed && !allowed?.includes?.(regionCode)) return true;
  return false;
}

function shouldSkipVideo(row) {
  const keywords = getSkipChannelKeywords();
  const channelIds = new Set(getSkipChannelIds());
  const channelTitle = String(row?.channelTitle || '').toLowerCase();
  const channelId = String(row?.channelId || '');

  if (channelId && channelIds.has(channelId)) return true;
  // Only filter by channel name/id to avoid accidentally skipping non-FIFA channels
  // that mention "FIFA" in the video title.
  return keywords.some((kw) => kw && channelTitle.includes(kw));
}

function isHighlightUsable(row) {
  if (!row) return false;
  if (shouldSkipVideo(row)) return false;
  if (row.blockedInRegion) return false;
  return true;
}

function isPreferredChannel(row) {
  const channelIds = new Set(getPreferredChannelIds());
  const channelId = String(row?.channelId || '');
  if (channelId && channelIds.has(channelId)) return true;

  const channelTitle = String(row?.channelTitle || '').toLowerCase();
  const keywords = getPreferredChannelKeywords();
  return keywords.some((kw) => kw && channelTitle.includes(kw));
}

function compareViewCountDesc(a, b) {
  const av = Number.isFinite(a?.viewCount) ? a.viewCount : -1;
  const bv = Number.isFinite(b?.viewCount) ? b.viewCount : -1;
  if (bv !== av) return bv - av;
  const ap = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0;
  const bp = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0;
  return bp - ap;
}

function rankHighlightResults(items) {
  const preferred = [];
  const other = [];
  for (const row of items || []) {
    if (isPreferredChannel(row)) preferred.push(row);
    else other.push(row);
  }
  preferred.sort(compareViewCountDesc);
  other.sort(compareViewCountDesc);
  return [...preferred, ...other];
}

function mergeHighlightResults(resultLists, { limit } = {}) {
  const seen = new Set();
  const merged = [];

  for (const rows of resultLists) {
    for (const row of rows || []) {
      if (!row?.videoId || seen.has(row.videoId)) continue;
      seen.add(row.videoId);
      merged.push(row);
      if (limit && merged.length >= limit) return merged;
    }
  }

  return limit ? merged.slice(0, limit) : merged;
}

function buildQuery({ homeTeam, awayTeam, kickoffTime }) {
  const home = String(homeTeam || '').trim();
  const away = String(awayTeam || '').trim();
  const year = kickoffTime ? new Date(kickoffTime).getFullYear() : '';
  return [home, away, year, 'highlights'].filter(Boolean).join(' ');
}

function parseYouTubeErrorBody(body) {
  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message || null;
  } catch {
    return null;
  }
}

async function youtubeFetchJson(url) {
  const https = require('node:https');
  const text = await new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { accept: 'application/json' } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const status = res.statusCode || 0;
        if (status < 200 || status >= 300) {
          const err = new Error(parseYouTubeErrorBody(body) || `YouTube request failed (${status})`);
          err.status = status;
          err.body = body;
          err.code = 'YOUTUBE_API_ERROR';
          reject(err);
          return;
        }
        resolve(body);
      });
    });
    req.on('error', (error) => {
      const err = new Error(error.message || 'YouTube request failed');
      err.code = 'YOUTUBE_API_ERROR';
      reject(err);
    });
    req.end();
  });

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function getPublishedAfterFilter(kickoffTime, hours = 18, now = new Date()) {
  if (!kickoffTime) return '';
  const kickoffMs = new Date(kickoffTime).getTime();
  if (!Number.isFinite(kickoffMs)) return '';
  // Highlights only exist after kickoff – future matches must not send a future publishedAfter.
  if (kickoffMs > now.getTime()) return '';
  const targetMs = kickoffMs - hours * 60 * 60 * 1000;
  return new Date(targetMs).toISOString();
}

async function searchMatchHighlights(match, { maxResults = 6 } = {}) {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) {
    const err = new Error('YOUTUBE_API_KEY missing');
    err.code = 'YOUTUBE_API_KEY_MISSING';
    throw err;
  }

  const query = buildQuery(match);

  const requireSyndicated = process.env.YOUTUBE_REQUIRE_SYNDICATED === 'true';
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const desired = clamp(Number(maxResults) || 6, 1, 25);
  const searchLimit = clamp(desired * 4, 8, 25);
  const regionCode = getRegionCode();
  const relevanceLanguage = getRelevanceLanguage();
  const preferredChannelIds = getPreferredChannelIds();

  async function searchOnce({ requireEmbeddable, channelId = null } = {}) {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', String(searchLimit));
    searchUrl.searchParams.set('q', query);
    if (channelId) searchUrl.searchParams.set('channelId', channelId);
    if (requireEmbeddable) searchUrl.searchParams.set('videoEmbeddable', 'true');
    if (requireSyndicated) searchUrl.searchParams.set('videoSyndicated', 'true');
    if (regionCode) searchUrl.searchParams.set('regionCode', regionCode);
    if (relevanceLanguage) searchUrl.searchParams.set('relevanceLanguage', relevanceLanguage);
    searchUrl.searchParams.set('safeSearch', 'none');
    const publishedAfter = getPublishedAfterFilter(match.kickoffTime, 18);
    if (publishedAfter) searchUrl.searchParams.set('publishedAfter', publishedAfter);
    searchUrl.searchParams.set('key', apiKey);

    const searchJson = await youtubeFetchJson(searchUrl.toString());
    const items = Array.isArray(searchJson?.items) ? searchJson.items : [];
    const videoIds = items
      .map((it) => it?.id?.videoId)
      .filter(Boolean);

    const base = items
      .map((it) => {
        const videoId = it?.id?.videoId;
        if (!videoId) return null;
        return {
          videoId,
          title: it.snippet?.title || '',
          channelTitle: it.snippet?.channelTitle || '',
          channelId: it.snippet?.channelId || '',
          publishedAt: it.snippet?.publishedAt || '',
          thumbnailUrl: it.snippet?.thumbnails?.medium?.url
            || it.snippet?.thumbnails?.default?.url
            || '',
          url: `https://www.youtube.com/watch?v=${videoId}`,
          preferred: isPreferredChannel({
            channelId: it.snippet?.channelId || '',
            channelTitle: it.snippet?.channelTitle || '',
          }),
        };
      })
      .filter(Boolean);

    if (videoIds.length === 0) return [];

    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videosUrl.searchParams.set('part', 'contentDetails,statistics,status');
    videosUrl.searchParams.set('id', videoIds.join(','));
    videosUrl.searchParams.set('key', apiKey);
    let details = [];
    try {
      const videosJson = await youtubeFetchJson(videosUrl.toString());
      details = Array.isArray(videosJson?.items) ? videosJson.items : [];
    } catch {
      details = [];
    }

    const detailMap = new Map(details.map((d) => [d.id, d]));
    return base.map((row) => {
      const d = detailMap.get(row.videoId);
      const viewCount = d?.statistics?.viewCount ? Number(d.statistics.viewCount) : null;
      const duration = d?.contentDetails?.duration || '';
      const embeddable = d?.status?.embeddable;
      const blockedInRegion = isBlockedInRegion(regionCode, d);
      return {
        ...row,
        viewCount: Number.isFinite(viewCount) ? viewCount : null,
        duration,
        embeddable: typeof embeddable === 'boolean' ? embeddable : null,
        blockedInRegion,
      };
    });
  }

  async function collectResults(requireEmbeddable) {
    const preferredLists = [];
    for (const channelId of preferredChannelIds) {
      try {
        preferredLists.push(await searchOnce({ requireEmbeddable, channelId }));
      } catch (error) {
        console.warn(`[YouTube] Preferred channel search failed (${channelId}): ${error.message}`);
        preferredLists.push([]);
      }
    }
    let general = [];
    try {
      general = await searchOnce({ requireEmbeddable });
    } catch (error) {
      console.warn(`[YouTube] General highlight search failed: ${error.message}`);
      if (preferredLists.every((rows) => rows.length === 0)) {
        throw error;
      }
    }
    const filtered = mergeHighlightResults([...preferredLists, general])
      .filter((row) => isHighlightUsable(row));
    return rankHighlightResults(filtered).slice(0, desired);
  }

  // 1) Preferred: embeddable (best UX in modal iframe), preferred channels first.
  const strict = await collectResults(true);
  if (strict.length > 0) {
    return { query, regionCode, relevanceLanguage, preferredChannelIds, items: strict };
  }

  // 2) Fallback: allow non-embeddable videos so admins can pick a "watch on YouTube" link.
  const relaxed = await collectResults(false);
  return { query, regionCode, relevanceLanguage, preferredChannelIds, items: relaxed };
}

async function fetchVideoDetailsByIds(videoIds = []) {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) {
    const err = new Error('YOUTUBE_API_KEY missing');
    err.code = 'YOUTUBE_API_KEY_MISSING';
    throw err;
  }

  const ids = [...new Set((videoIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!ids.length) return [];

  const regionCode = getRegionCode();
  const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  videosUrl.searchParams.set('part', 'snippet,contentDetails,statistics,status');
  videosUrl.searchParams.set('id', ids.join(','));
  videosUrl.searchParams.set('key', apiKey);

  const videosJson = await youtubeFetchJson(videosUrl.toString());
  const items = Array.isArray(videosJson?.items) ? videosJson.items : [];

  return items.map((item) => {
    const viewCount = item.statistics?.viewCount ? Number(item.statistics.viewCount) : null;
    const embeddable = item.status?.embeddable;
    const blockedInRegion = isBlockedInRegion(regionCode, item);
    return {
      videoId: item.id,
      title: item.snippet?.title || '',
      channelTitle: item.snippet?.channelTitle || '',
      channelId: item.snippet?.channelId || '',
      publishedAt: item.snippet?.publishedAt || '',
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url
        || item.snippet?.thumbnails?.default?.url
        || '',
      url: item.id ? `https://www.youtube.com/watch?v=${item.id}` : '',
      viewCount: Number.isFinite(viewCount) ? viewCount : null,
      duration: item.contentDetails?.duration || '',
      embeddable: typeof embeddable === 'boolean' ? embeddable : null,
      blockedInRegion,
      preferred: isPreferredChannel({
        channelId: item.snippet?.channelId || '',
        channelTitle: item.snippet?.channelTitle || '',
      }),
    };
  });
}

module.exports = {
  searchMatchHighlights,
  fetchVideoDetailsByIds,
  buildQuery,
  isPreferredChannel,
  shouldSkipVideo,
  isBlockedInRegion,
  isHighlightUsable,
  rankHighlightResults,
  compareViewCountDesc,
  mergeHighlightResults,
  getPreferredChannelIds,
  getPreferredChannelKeywords,
  getSkipChannelKeywords,
  getRegionCode,
  getRelevanceLanguage,
  getPublishedAfterFilter,
  DEFAULT_PREFERRED_CHANNEL_IDS,
  DEFAULT_SKIP_CHANNEL_KEYWORDS,
  DEFAULT_REGION_CODE,
  DEFAULT_RELEVANCE_LANGUAGE,
};
