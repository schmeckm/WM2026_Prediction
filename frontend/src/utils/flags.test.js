import { describe, expect, it } from 'vitest';
import { getTeamIso, getTeamFlagImage } from './flags';

const WM2026_TEAMS = [
  'Algerien', 'Argentinien', 'Australien', 'Belgien', 'Bosnien und Herzegowina',
  'Brasilien', 'Curaçao', 'DR Kongo', 'Deutschland', 'Ecuador', 'Elfenbeinküste',
  'England', 'Frankreich', 'Ghana', 'Haiti', 'Irak', 'Iran', 'Japan', 'Jordanien',
  'Kanada', 'Kap Verde', 'Katar', 'Kolumbien', 'Kroatien', 'Marokko', 'Mexiko',
  'Neuseeland', 'Niederlande', 'Norwegen', 'Panama', 'Paraguay', 'Portugal',
  'Saudi-Arabien', 'Schottland', 'Schweden', 'Schweiz', 'Senegal', 'Spanien',
  'Südafrika', 'Südkorea', 'Tschechien', 'Tunesien', 'Türkei', 'USA', 'Uruguay',
  'Usbekistan', 'Ägypten', 'Österreich',
];

describe('flags', () => {
  it('maps all WM 2026 national teams to ISO codes', () => {
    for (const team of WM2026_TEAMS) {
      expect(getTeamIso(team), team).toBeTruthy();
    }
  });

  it('resolves umlaut and alias variants', () => {
    expect(getTeamIso('Südafrika')).toBe('ZA');
    expect(getTeamIso('Sudafrika')).toBe('ZA');
    expect(getTeamIso('Ägypten')).toBe('EG');
    expect(getTeamIso('Elfenbeinküste')).toBe('CI');
    expect(getTeamIso('Curaçao')).toBe('CW');
  });

  it('builds flagcdn URLs from team names', () => {
    expect(getTeamFlagImage('Tschechien')).toBe('https://flagcdn.com/w40/cz.png');
    expect(getTeamFlagImage('Haiti', 80)).toBe('https://flagcdn.com/w80/ht.png');
  });
});
