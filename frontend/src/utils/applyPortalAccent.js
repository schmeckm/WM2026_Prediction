import { resolvePortalAccentColors, normalizePortalAccent } from './portalAccentColors';

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function buildAccentCssVars(colors) {
  const { r, g, b } = hexToRgb(colors.primary);
  return {
    '--sapBrandColor': colors.primary,
    '--sapHighlightColor': colors.primaryDark,
    '--sapListSelectionBackground': `rgba(${r}, ${g}, ${b}, 0.1)`,
    '--sapSuccessBackground': `rgba(${r}, ${g}, ${b}, 0.12)`,
    '--sapSuccessColor': colors.primary,
    '--sapInformationBackground': `rgba(${r}, ${g}, ${b}, 0.08)`,
    '--sapInformationColor': colors.primary,
    '--color-primary': colors.primary,
    '--color-primary-light': colors.primaryLight,
    '--color-primary-dark': colors.primaryDark,
    '--color-primary-soft': `rgba(${r}, ${g}, ${b}, 0.1)`,
    '--color-primary-bg': `rgba(${r}, ${g}, ${b}, 0.12)`,
    '--color-accent': colors.primary,
    '--color-accent-dark': colors.primaryDark,
    '--color-success': colors.primary,
    '--color-success-bg': `rgba(${r}, ${g}, ${b}, 0.12)`,
    '--color-info': colors.primary,
    '--glow-primary': `0 0 20px rgba(${r}, ${g}, ${b}, 0.25)`,
    '--glow-card': `0 0 40px rgba(${r}, ${g}, ${b}, 0.06)`,
    '--sidebar-accent': colors.primary,
    '--sidebar-icon-active-bg': `rgba(${r}, ${g}, ${b}, 0.12)`,
    '--sidebar-active': `rgba(${r}, ${g}, ${b}, 0.1)`,
  };
}

function applyVarsToElement(element, vars) {
  for (const [key, value] of Object.entries(vars)) {
    element.style.setProperty(key, value);
  }
}

export function applyPortalAccent(accentId, theme = 'dark') {
  const normalized = normalizePortalAccent(accentId);
  const colors = resolvePortalAccentColors(normalized, theme);
  const vars = buildAccentCssVars(colors);

  document.documentElement.setAttribute('data-portal-accent', normalized);
  applyVarsToElement(document.documentElement, vars);

  document.querySelectorAll('[data-area="app"]').forEach((element) => {
    applyVarsToElement(element, vars);
  });
}

export function clearPortalAccent() {
  document.documentElement.removeAttribute('data-portal-accent');
  const targets = [document.documentElement, ...document.querySelectorAll('[data-area="app"]')];
  const keys = Object.keys(buildAccentCssVars(resolvePortalAccentColors('green', 'dark')));
  targets.forEach((element) => {
    keys.forEach((key) => element.style.removeProperty(key));
  });
}
