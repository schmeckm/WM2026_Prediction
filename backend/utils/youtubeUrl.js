function extractYoutubeId(url) {
  if (!url) return '';
  const str = String(url).trim();
  try {
    const u = new URL(str);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '');
    }
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/').filter(Boolean);
    const embedIdx = parts.indexOf('embed');
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    const shortsIdx = parts.indexOf('shorts');
    if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
  } catch {
    // ignore parse errors
  }
  const m = str.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] || '';
}

function buildYoutubeWatchUrl(url) {
  const raw = String(url || '').trim();
  const id = extractYoutubeId(raw);
  if (id) return `https://www.youtube.com/watch?v=${id}`;
  return raw;
}

module.exports = {
  extractYoutubeId,
  buildYoutubeWatchUrl,
};
