export const PORTAL_ACCENT_OPTIONS = [
  {
    id: 'green',
    labelKey: 'profile.portalAccents.green',
    swatch: '#00FF7F',
    dark: { primary: '#00FF7F', primaryDark: '#00CC66', primaryLight: '#39FF14' },
    light: { primary: '#00724A', primaryDark: '#005A3A', primaryLight: '#00995E' },
  },
  {
    id: 'blue',
    labelKey: 'profile.portalAccents.blue',
    swatch: '#3B9EFF',
    dark: { primary: '#3B9EFF', primaryDark: '#2B7ACC', primaryLight: '#6BB5FF' },
    light: { primary: '#1565A8', primaryDark: '#0F4D82', primaryLight: '#1E88E5' },
  },
  {
    id: 'cyan',
    labelKey: 'profile.portalAccents.cyan',
    swatch: '#00E5FF',
    dark: { primary: '#00E5FF', primaryDark: '#00B8CC', primaryLight: '#4DEEFF' },
    light: { primary: '#00838F', primaryDark: '#006064', primaryLight: '#00ACC1' },
  },
  {
    id: 'orange',
    labelKey: 'profile.portalAccents.orange',
    swatch: '#FF9F43',
    dark: { primary: '#FF9F43', primaryDark: '#CC7F36', primaryLight: '#FFB86C' },
    light: { primary: '#C45C26', primaryDark: '#9A4719', primaryLight: '#E07030' },
  },
  {
    id: 'purple',
    labelKey: 'profile.portalAccents.purple',
    swatch: '#A78BFA',
    dark: { primary: '#A78BFA', primaryDark: '#8662C8', primaryLight: '#C4B5FD' },
    light: { primary: '#5B4BA8', primaryDark: '#483A86', primaryLight: '#7C6BC4' },
  },
  {
    id: 'pink',
    labelKey: 'profile.portalAccents.pink',
    swatch: '#FF6B9D',
    dark: { primary: '#FF6B9D', primaryDark: '#CC567E', primaryLight: '#FF94B8' },
    light: { primary: '#8E3A6A', primaryDark: '#6E2D52', primaryLight: '#B34D87' },
  },
  {
    id: 'red',
    labelKey: 'profile.portalAccents.red',
    swatch: '#FF5757',
    dark: { primary: '#FF5757', primaryDark: '#CC4545', primaryLight: '#FF8282' },
    light: { primary: '#AA0808', primaryDark: '#880606', primaryLight: '#CC2020' },
  },
  {
    id: 'gold',
    labelKey: 'profile.portalAccents.gold',
    swatch: '#FFD700',
    dark: { primary: '#FFD700', primaryDark: '#CCAC00', primaryLight: '#FFE44D' },
    light: { primary: '#B8860B', primaryDark: '#926B09', primaryLight: '#D4A017' },
  },
];

const ACCENT_BY_ID = Object.fromEntries(
  PORTAL_ACCENT_OPTIONS.map((option) => [option.id, option]),
);

export function resolvePortalAccentColors(accentId, theme = 'dark') {
  const option = ACCENT_BY_ID[accentId] || ACCENT_BY_ID.green;
  return theme === 'light' ? option.light : option.dark;
}

export function normalizePortalAccent(value) {
  if (value == null || value === '') return 'green';
  const id = String(value).toLowerCase().trim();
  return ACCENT_BY_ID[id] ? id : 'green';
}
