import { getTeamIso } from './flags';

const ISO_TO_FIFA = {
  DE: 'GER',
  CI: 'CIV',
  AR: 'ARG',
  AU: 'AUS',
  BE: 'BEL',
  BA: 'BIH',
  BR: 'BRA',
  CA: 'CAN',
  CV: 'CPV',
  CL: 'CHI',
  CN: 'CHN',
  CR: 'CRC',
  CW: 'CUW',
  CZ: 'CZE',
  CD: 'COD',
  EC: 'ECU',
  EG: 'EGY',
  FR: 'FRA',
  GH: 'GHA',
  HT: 'HAI',
  IR: 'IRN',
  IQ: 'IRQ',
  IT: 'ITA',
  JP: 'JPN',
  JO: 'JOR',
  CM: 'CMR',
  QA: 'QAT',
  CO: 'COL',
  HR: 'CRO',
  MA: 'MAR',
  MX: 'MEX',
  NL: 'NED',
  NZ: 'NZL',
  MK: 'MKD',
  NO: 'NOR',
  AT: 'AUT',
  PA: 'PAN',
  PY: 'PAR',
  PE: 'PER',
  PL: 'POL',
  PT: 'POR',
  SA: 'KSA',
  SE: 'SWE',
  CH: 'SUI',
  SN: 'SEN',
  RS: 'SRB',
  ES: 'ESP',
  KR: 'KOR',
  ZA: 'RSA',
  TN: 'TUN',
  TR: 'TUR',
  UY: 'URU',
  US: 'USA',
  UZ: 'UZB',
  UA: 'UKR',
  HU: 'HUN',
  CF: 'CTA',
  DZ: 'ALG',
};

const NAME_TO_FIFA = {
  england: 'ENG',
  schottland: 'SCO',
  scotland: 'SCO',
  wales: 'WAL',
  nordirland: 'NIR',
  'northern ireland': 'NIR',
};

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getFifaTeamCode(teamName) {
  const normalized = normalizeName(teamName);
  if (NAME_TO_FIFA[normalized]) return NAME_TO_FIFA[normalized];

  const iso = getTeamIso(teamName);
  if (iso && ISO_TO_FIFA[iso]) return ISO_TO_FIFA[iso];
  if (iso) return iso;

  return String(teamName || '').slice(0, 3).toUpperCase();
}
