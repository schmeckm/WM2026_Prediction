/**
 * FIFA WM 2026 host cities and stadiums (Wikipedia / FIFA official designations).
 * Keys are normalized for fuzzy stadium name matching.
 * Stadium images: Wikimedia Commons (500px thumbnails from Wikipedia article).
 */
const WM2026_VENUES = [
  {
    city: 'Toronto',
    country: 'Canada',
    stadium: 'BMO Field',
    fifaStadium: 'Toronto-Stadion',
    capacity: 45000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Toronto_BMO_Field_in_2024.jpg/500px-Toronto_BMO_Field_in_2024.jpg',
    aliases: ['bmo field', 'toronto stadium', 'toronto stadion'],
  },
  {
    city: 'Vancouver',
    country: 'Canada',
    stadium: 'BC Place Stadium',
    fifaStadium: 'Vancouver-Stadion',
    capacity: 54000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/BC_Place_2015_Women%27s_FIFA_World_Cup.jpg/500px-BC_Place_2015_Women%27s_FIFA_World_Cup.jpg',
    aliases: ['bc place', 'bc place stadium', 'vancouver stadium', 'vancouver stadion'],
  },
  {
    city: 'Dallas',
    country: 'United States',
    stadium: 'AT&T Stadium',
    fifaStadium: 'Dallas-Stadion',
    capacity: 94000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Cowboys_stadium_inside_view_4.JPG/500px-Cowboys_stadium_inside_view_4.JPG',
    aliases: ['at t stadium', 'att stadium', 'dallas stadium', 'dallas stadion', 'cowboys stadium', 'arlington'],
  },
  {
    city: 'Atlanta',
    country: 'United States',
    stadium: 'Mercedes-Benz Stadium',
    fifaStadium: 'Atlanta-Stadion',
    capacity: 75000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Mercedes-Benz_Stadium%2C_December_2024.jpg/500px-Mercedes-Benz_Stadium%2C_December_2024.jpg',
    aliases: ['mercedes benz stadium', 'mercedes-benz stadium', 'atlanta stadium', 'atlanta stadion'],
  },
  {
    city: 'East Rutherford',
    country: 'United States',
    stadium: 'MetLife Stadium',
    fifaStadium: 'New-York-New-Jersey-Stadion',
    capacity: 82500,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Copa_America_game_between_Columbia_vs_Peru_at_the_MetLife_Stadium.jpg/500px-Copa_America_game_between_Columbia_vs_Peru_at_the_MetLife_Stadium.jpg',
    aliases: ['metlife stadium', 'new york new jersey stadium', 'new york stadium', 'giants stadium'],
  },
  {
    city: 'Foxborough',
    country: 'United States',
    stadium: 'Gillette Stadium',
    fifaStadium: 'Boston-Stadion',
    capacity: 65000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Gillette_Stadium_%28Top_View%29.jpg/500px-Gillette_Stadium_%28Top_View%29.jpg',
    aliases: ['gillette stadium', 'boston stadium', 'boston stadion'],
  },
  {
    city: 'Houston',
    country: 'United States',
    stadium: 'NRG Stadium',
    fifaStadium: 'Houston-Stadion',
    capacity: 72000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Reliantstadium.jpg/500px-Reliantstadium.jpg',
    aliases: ['nrg stadium', 'reliant stadium', 'houston stadium', 'houston stadion'],
  },
  {
    city: 'Inglewood',
    country: 'United States',
    stadium: 'SoFi Stadium',
    fifaStadium: 'Los-Angeles-Stadion',
    capacity: 70000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/SoFi_Stadium_interior_2021.jpg/500px-SoFi_Stadium_interior_2021.jpg',
    aliases: ['sofi stadium', 'los angeles stadium', 'los angeles stadion', 'la stadium'],
  },
  {
    city: 'Kansas City',
    country: 'United States',
    stadium: 'Arrowhead Stadium',
    fifaStadium: 'Kansas-City-Stadion',
    capacity: 73000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Arrowhead_Stadium_%28October_27%2C_2019_-_2%29.jpg/500px-Arrowhead_Stadium_%28October_27%2C_2019_-_2%29.jpg',
    aliases: ['arrowhead stadium', 'kansas city stadium', 'kansas city stadion'],
  },
  {
    city: 'Miami Gardens',
    country: 'United States',
    stadium: 'Hard Rock Stadium',
    fifaStadium: 'Miami-Stadion',
    capacity: 65000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Hard_Rock_Stadium_2017_2.jpg/500px-Hard_Rock_Stadium_2017_2.jpg',
    aliases: ['hard rock stadium', 'miami stadium', 'miami stadion', 'miami gardens'],
  },
  {
    city: 'Philadelphia',
    country: 'United States',
    stadium: 'Lincoln Financial Field',
    fifaStadium: 'Philadelphia-Stadion',
    capacity: 69000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Lincoln_Financial_Field%2C_Philadelphia%2C_2024.jpg/500px-Lincoln_Financial_Field%2C_Philadelphia%2C_2024.jpg',
    aliases: ['lincoln financial field', 'philadelphia stadium', 'philadelphia stadion'],
  },
  {
    city: 'Santa Clara',
    country: 'United States',
    stadium: "Levi's Stadium",
    fifaStadium: 'San-Francisco-Bay-Area-Stadion',
    capacity: 71000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Broncos_vs_49ers_preseason_game_at_Levi%27s_Stadium.jpg/500px-Broncos_vs_49ers_preseason_game_at_Levi%27s_Stadium.jpg',
    aliases: ['levis stadium', 'levi s stadium', 'levi stadium', 'san francisco bay area stadium', 'san francisco stadium'],
  },
  {
    city: 'Seattle',
    country: 'United States',
    stadium: 'Lumen Field',
    fifaStadium: 'Seattle-Stadion',
    capacity: 69000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Qwest_Field_North.jpg/500px-Qwest_Field_North.jpg',
    aliases: ['lumen field', 'centurylink field', 'seattle stadium', 'seattle stadion', 'qwest field'],
  },
  {
    city: 'Monterrey',
    country: 'Mexico',
    stadium: 'Estadio BBVA',
    fifaStadium: 'Monterrey-Stadion',
    capacity: 53500,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Estadio_BBVA_Bancomer_-_Diciembre_2017.jpg/500px-Estadio_BBVA_Bancomer_-_Diciembre_2017.jpg',
    aliases: ['estadio bbva', 'bbva stadium', 'monterrey stadium', 'monterrey stadion', 'estadio bbva bancomer', 'guadalupe'],
  },
  {
    city: 'Mexico City',
    country: 'Mexico',
    stadium: 'Estadio Azteca',
    fifaStadium: 'Mexiko-Stadt-Stadion',
    capacity: 83000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Soccer_game_at_the_Azteca_Stadium.JPG/500px-Soccer_game_at_the_Azteca_Stadium.JPG',
    aliases: ['estadio azteca', 'azteca stadium', 'aztekenstadion', 'mexico city stadium', 'mexiko stadt stadion', 'mexico city'],
  },
  {
    city: 'Guadalajara',
    country: 'Mexico',
    stadium: 'Estadio Akron',
    fifaStadium: 'Guadalajara-Stadion',
    capacity: 48000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho.jpg/500px-Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho.jpg',
    aliases: ['estadio akron', 'akron stadium', 'guadalajara stadium', 'guadalajara stadion', 'zapopan'],
  },
];

const COUNTRY_ONLY_VALUES = new Set([
  'mexico',
  'mexiko',
  'canada',
  'kanada',
  'united states',
  'usa',
  'vereinigte staaten',
  'us',
]);

function normalizeStadiumKey(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STADIUM_TO_CITY = new Map();
const STADIUM_TO_VENUE = new Map();

for (const venue of WM2026_VENUES) {
  for (const alias of venue.aliases) {
    const key = normalizeStadiumKey(alias);
    STADIUM_TO_CITY.set(key, venue.city);
    STADIUM_TO_VENUE.set(key, venue);
  }
}

function findVenueByStadiumKey(key) {
  if (!key) return null;
  if (STADIUM_TO_VENUE.has(key)) {
    return STADIUM_TO_VENUE.get(key);
  }
  for (const [alias, venue] of STADIUM_TO_VENUE.entries()) {
    if (key.includes(alias) || alias.includes(key)) {
      return venue;
    }
  }
  return null;
}

function resolveVenueFromStadium(stadiumName) {
  return findVenueByStadiumKey(normalizeStadiumKey(stadiumName));
}

function resolveCityFromStadium(stadiumName) {
  const venue = resolveVenueFromStadium(stadiumName);
  return venue?.city || null;
}

function resolveVenueImageFromStadium(stadiumName) {
  return resolveVenueFromStadium(stadiumName)?.imageUrl || null;
}

function isCountryOnlyCity(city) {
  return COUNTRY_ONLY_VALUES.has(normalizeStadiumKey(city));
}

function shouldReplaceCity(stadium, city) {
  if (!stadium) return false;
  if (!city) return true;
  return isCountryOnlyCity(city);
}

module.exports = {
  WM2026_VENUES,
  normalizeStadiumKey,
  resolveVenueFromStadium,
  resolveCityFromStadium,
  resolveVenueImageFromStadium,
  isCountryOnlyCity,
  shouldReplaceCity,
};
