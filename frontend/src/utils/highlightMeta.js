export function formatHighlightViews(count) {
  if (!Number.isFinite(count)) return '';
  if (count >= 1_000_000) return `${Math.round(count / 100_000) / 10}M`;
  if (count >= 10_000) return `${Math.round(count / 1000)}K`;
  if (count >= 1000) return `${Math.round(count / 100) / 10}K`;
  return String(count);
}

export function formatHighlightTooltip(meta, fallbackLabel = 'Highlights') {
  if (!meta) return fallbackLabel;
  const parts = [
    meta.title,
    meta.channelTitle,
    Number.isFinite(meta.viewCount) ? `${formatHighlightViews(meta.viewCount)} views` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : fallbackLabel;
}

export function formatHighlightMetaLine(meta, t) {
  if (!meta) return '';
  const chunks = [];
  if (meta.title) chunks.push(meta.title);
  if (Number.isFinite(meta.viewCount)) {
    chunks.push(t('matches.highlightsMetaViews', { count: formatHighlightViews(meta.viewCount) }));
  }
  return chunks.join(' · ');
}
