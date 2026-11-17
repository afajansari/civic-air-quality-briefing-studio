/**
 * Live India AQI Monitoring Network - Predefined Cities & CAAQMS Stations
 * Coordinates, regional classifications, and fuzzy resolution helpers for
 * Central Pollution Control Board (CPCB) and State Pollution Control Board grids.
 */

export interface IndianCityStation {
  id: string;
  name: string;
  city: string;
  station: string;
  state: string;
  region: 'NCR' | 'West' | 'South' | 'North' | 'East' | 'North & East';
  lat: number;
  lon: number;
  description?: string;
  aliases?: string[];
}

export const INDIAN_CITIES: IndianCityStation[] = [
  // --- NCR (National Capital Region) ---
  {
    id: 'delhi-anand-vihar',
    name: 'Delhi (Anand Vihar)',
    city: 'Delhi',
    station: 'Anand Vihar CAAQMS',
    state: 'Delhi',
    region: 'NCR',
    lat: 28.6469,
    lon: 77.3160,
    description: 'High-traffic trans-Yamuna ISBT transit hub prone to severe particulate trapping and inversion.',
    aliases: ['anand vihar', 'anand vihar caaqms', 'delhi anand vihar', 'isbt anand vihar']
  },
  {
    id: 'delhi-rohini',
    name: 'Delhi (Rohini)',
    city: 'Delhi',
    station: 'Rohini CAAQMS',
    state: 'Delhi',
    region: 'NCR',
    lat: 28.7325,
    lon: 77.1189,
    description: 'North-West Delhi residential and commercial corridor near outer ring road.',
    aliases: ['rohini', 'rohini caaqms', 'delhi rohini']
  },
  {
    id: 'delhi-igi-airport',
    name: 'Delhi (IGI Airport)',
    city: 'Delhi',
    station: 'IGI Airport T3 CAAQMS',
    state: 'Delhi',
    region: 'NCR',
    lat: 28.5623,
    lon: 77.0990,
    description: 'Indira Gandhi International Airport aviation and highway boundary monitoring.',
    aliases: ['igi airport', 'igi', 'palam', 'delhi airport', 'igi airport t3']
  },
  {
    id: 'delhi-rk-puram',
    name: 'Delhi (RK Puram)',
    city: 'Delhi',
    station: 'RK Puram Sector 12 CAAQMS',
    state: 'Delhi',
    region: 'NCR',
    lat: 28.5660,
    lon: 77.1767,
    description: 'South Delhi institutional and residential zone reflecting urban background baseline.',
    aliases: ['rk puram', 'r k puram', 'rk puram delhi', 'rk puram sector 12']
  },
  {
    id: 'delhi',
    name: 'Delhi (Central)',
    city: 'Delhi',
    station: 'Delhi CAAQMS Central Grid',
    state: 'Delhi',
    region: 'NCR',
    lat: 28.6139,
    lon: 77.2090,
    description: 'Capital territory central urban grid (CPCB / DPCC aggregate).',
    aliases: ['delhi', 'new delhi', 'nct', 'delhi nct']
  },

  // --- West ---
  {
    id: 'mumbai-bandra',
    name: 'Mumbai (Bandra)',
    city: 'Mumbai',
    station: 'Bandra CAAQMS',
    state: 'Maharashtra',
    region: 'West',
    lat: 19.0596,
    lon: 72.8295,
    description: 'Coastal commercial-residential transition hub near BKC.',
    aliases: ['bandra', 'bandra caaqms', 'mumbai bandra', 'bandra west', 'bkc']
  },
  {
    id: 'mumbai-colaba',
    name: 'Mumbai (Colaba)',
    city: 'Mumbai',
    station: 'Colaba CAAQMS',
    state: 'Maharashtra',
    region: 'West',
    lat: 18.9067,
    lon: 72.8147,
    description: 'South Mumbai coastal monitoring station with maritime breeze influence.',
    aliases: ['colaba', 'colaba caaqms', 'mumbai colaba']
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    city: 'Mumbai',
    station: 'Mumbai MPCB CAAQMS Grid',
    state: 'Maharashtra',
    region: 'West',
    lat: 19.0760,
    lon: 72.8777,
    description: 'Greater Mumbai metropolitan ambient air monitoring grid.',
    aliases: ['mumbai', 'bombay']
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    city: 'Ahmedabad',
    station: 'Ahmedabad GPCB Station',
    state: 'Gujarat',
    region: 'West',
    lat: 23.0225,
    lon: 72.5714,
    description: 'Industrial and commercial hub in western Gujarat with heavy vehicular and textile emissions.',
    aliases: ['ahmedabad', 'amdavad', 'ahmadabad']
  },
  {
    id: 'pune',
    name: 'Pune',
    city: 'Pune',
    station: 'Pune Shivajinagar CAAQMS',
    state: 'Maharashtra',
    region: 'West',
    lat: 18.5204,
    lon: 73.8567,
    description: 'Deccan plateau valley basin prone to winter particulate accumulation.',
    aliases: ['pune', 'poona', 'shivajinagar pune']
  },

  // --- South ---
  {
    id: 'bengaluru-btm',
    name: 'Bengaluru (BTM Layout)',
    city: 'Bengaluru',
    station: 'BTM Layout CAAQMS',
    state: 'Karnataka',
    region: 'South',
    lat: 12.9166,
    lon: 77.6101,
    description: 'South Bengaluru IT and residential junction with dense arterial traffic.',
    aliases: ['btm', 'btm layout', 'bengaluru btm', 'bangalore btm', 'btm layout caaqms']
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    city: 'Bengaluru',
    station: 'Bengaluru KSPCB CAAQMS Grid',
    state: 'Karnataka',
    region: 'South',
    lat: 12.9716,
    lon: 77.5946,
    description: 'Greater Bengaluru urban grid representing elevated plateau ambient levels.',
    aliases: ['bengaluru', 'bangalore']
  },
  {
    id: 'chennai-alandur',
    name: 'Chennai (Alandur)',
    city: 'Chennai',
    station: 'Alandur CAAQMS',
    state: 'Tamil Nadu',
    region: 'South',
    lat: 13.0034,
    lon: 80.2036,
    description: 'Corridor monitoring near Kathipara junction with high vehicular density.',
    aliases: ['alandur', 'chennai alandur', 'alandur caaqms']
  },
  {
    id: 'chennai',
    name: 'Chennai',
    city: 'Chennai',
    station: 'Chennai TNPCB CAAQMS Grid',
    state: 'Tamil Nadu',
    region: 'South',
    lat: 13.0827,
    lon: 80.2707,
    description: 'Coromandel coastal urban monitoring network.',
    aliases: ['chennai', 'madras']
  },
  {
    id: 'hyderabad-sanathnagar',
    name: 'Hyderabad (Sanathnagar)',
    city: 'Hyderabad',
    station: 'Sanathnagar CAAQMS',
    state: 'Telangana',
    region: 'South',
    lat: 17.4560,
    lon: 78.4410,
    description: 'Industrial and commercial zone in central Hyderabad.',
    aliases: ['sanathnagar', 'sanath nagar', 'hyderabad sanathnagar', 'sanathnagar caaqms']
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    city: 'Hyderabad',
    station: 'Hyderabad TSPCB CAAQMS Grid',
    state: 'Telangana',
    region: 'South',
    lat: 17.3850,
    lon: 78.4867,
    description: 'Greater Hyderabad metropolitan ambient network.',
    aliases: ['hyderabad', 'secunderabad']
  },

  // --- North & East ---
  {
    id: 'kolkata-victoria',
    name: 'Kolkata (Victoria Memorial)',
    city: 'Kolkata',
    station: 'Victoria Memorial CAAQMS',
    state: 'West Bengal',
    region: 'North & East',
    lat: 22.5448,
    lon: 88.3426,
    description: 'Central green buffer and cultural heritage air quality monitoring station.',
    aliases: ['victoria memorial', 'kolkata victoria', 'victoria', 'victoria memorial caaqms']
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    city: 'Kolkata',
    station: 'Kolkata WBPCB CAAQMS Grid',
    state: 'West Bengal',
    region: 'North & East',
    lat: 22.5726,
    lon: 88.3639,
    description: 'Lower Indo-Gangetic Plain riverine delta urban airshed.',
    aliases: ['kolkata', 'calcutta']
  },
  {
    id: 'lucknow',
    name: 'Lucknow',
    city: 'Lucknow',
    station: 'Lucknow Lalbagh CAAQMS',
    state: 'Uttar Pradesh',
    region: 'North & East',
    lat: 26.8467,
    lon: 80.9462,
    description: 'Central Gangetic plain urban core with winter calm-wind particulate stagnation.',
    aliases: ['lucknow', 'lalbagh', 'lucknow lalbagh']
  },
  {
    id: 'kanpur',
    name: 'Kanpur',
    city: 'Kanpur',
    station: 'Kanpur Nehru Nagar CAAQMS',
    state: 'Uttar Pradesh',
    region: 'North & East',
    lat: 26.4499,
    lon: 80.3319,
    description: 'Major industrial centre on the Ganges with heavy particulate and tanneries airshed.',
    aliases: ['kanpur', 'cawnpore', 'nehru nagar kanpur']
  },
  {
    id: 'patna',
    name: 'Patna',
    city: 'Patna',
    station: 'Patna Samanpura CAAQMS',
    state: 'Bihar',
    region: 'North & East',
    lat: 25.5941,
    lon: 85.1376,
    description: 'Middle Gangetic plain airshed with high seasonal biomass and alluvial dust loads.',
    aliases: ['patna', 'samanpura', 'patna samanpura']
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    city: 'Jaipur',
    station: 'Jaipur Adarsh Nagar CAAQMS',
    state: 'Rajasthan',
    region: 'North & East',
    lat: 26.9124,
    lon: 75.7873,
    description: 'Semi-arid eastern Rajasthan basin influenced by desert dust and vehicular flow.',
    aliases: ['jaipur', 'pink city', 'adarsh nagar jaipur']
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    city: 'Varanasi',
    station: 'Varanasi Bhelupur CAAQMS',
    state: 'Uttar Pradesh',
    region: 'North & East',
    lat: 25.3176,
    lon: 82.9739,
    description: 'Sacred riverfront city with high population density and winter thermal inversions.',
    aliases: ['varanasi', 'banaras', 'kashi', 'bhelupur varanasi']
  },
  {
    id: 'chandigarh',
    name: 'Chandigarh',
    city: 'Chandigarh',
    station: 'Chandigarh Sector 22 CAAQMS',
    state: 'Chandigarh',
    region: 'North',
    lat: 30.7333,
    lon: 76.7794,
    description: 'Sub-Himalayan planned capital city monitoring station.',
    aliases: ['chandigarh', 'sec 22 chandigarh', 'sector 22']
  }
];

/**
 * Regional station groupings for quick-select UI chips in DataIngestion.tsx
 */
export const REGIONAL_CHIPS: { region: string; stations: IndianCityStation[] }[] = [
  {
    region: 'NCR',
    stations: INDIAN_CITIES.filter(c => c.region === 'NCR' && c.id !== 'delhi')
  },
  {
    region: 'West',
    stations: INDIAN_CITIES.filter(c => ['mumbai-bandra', 'ahmedabad', 'pune'].includes(c.id))
  },
  {
    region: 'South',
    stations: INDIAN_CITIES.filter(c => ['bengaluru-btm', 'chennai-alandur', 'hyderabad-sanathnagar'].includes(c.id))
  },
  {
    region: 'North & East',
    stations: INDIAN_CITIES.filter(c => ['kolkata-victoria', 'lucknow', 'kanpur', 'patna', 'jaipur', 'varanasi'].includes(c.id))
  }
];

/**
 * Case-insensitively find an Indian city or station from the predefined list.
 * Prioritizes specific station matches (e.g. Anand Vihar, Bandra) before falling
 * back to general city center entries.
 */
export function findCityCoordinates(query: string): IndianCityStation | null {
  if (!query || typeof query !== 'string') return null;

  const q = query.trim().toLowerCase();
  if (!q) return null;

  // 1. Exact ID match
  const exactId = INDIAN_CITIES.find(c => c.id.toLowerCase() === q);
  if (exactId) return exactId;

  // 2. Exact Name or Station match
  const exactName = INDIAN_CITIES.find(
    c => c.name.toLowerCase() === q || c.station.toLowerCase() === q
  );
  if (exactName) return exactName;

  // 3. Exact Alias match
  const exactAlias = INDIAN_CITIES.find(c =>
    c.aliases?.some(alias => alias.toLowerCase() === q)
  );
  if (exactAlias) return exactAlias;

  // 4. Substring / Token matches - Specific stations first (having a hyphen in ID)
  const specificStations = INDIAN_CITIES.filter(c => c.id.includes('-'));
  for (const st of specificStations) {
    if (q.includes(st.city.toLowerCase())) {
      // If query also includes station name or alias
      if (
        q.includes(st.name.toLowerCase()) ||
        st.aliases?.some(a => q.includes(a.toLowerCase()))
      ) {
        return st;
      }
    } else {
      if (
        st.aliases?.some(a => q.includes(a.toLowerCase()) || a.toLowerCase().includes(q))
      ) {
        return st;
      }
    }
  }

  // 5. Query contains specific station identifier (e.g. "anand vihar")
  const aliasSubstring = INDIAN_CITIES.find(c =>
    c.aliases?.some(a => q.includes(a) || a.includes(q))
  );
  if (aliasSubstring) return aliasSubstring;

  // 6. City name match (fallback to general city if no station specific specified)
  const cityMatch = INDIAN_CITIES.find(
    c => c.city.toLowerCase() === q || q.includes(c.city.toLowerCase())
  );
  if (cityMatch) return cityMatch;

  return null;
}

export interface OpenMeteoAirQualityPayload {
  current?: {
    time?: string;
    pm10?: number | null;
    pm2_5?: number | null;
    carbon_monoxide?: number | null;
    nitrogen_dioxide?: number | null;
    sulphur_dioxide?: number | null;
    ozone?: number | null;
  };
  hourly?: {
    time?: string[];
    pm10?: (number | null)[];
    pm2_5?: (number | null)[];
    carbon_monoxide?: (number | null)[];
    nitrogen_dioxide?: (number | null)[];
    sulphur_dioxide?: (number | null)[];
    ozone?: (number | null)[];
  };
}

/**
 * Format Open-Meteo Air Quality telemetry into standardized 8-column CSV:
 * Station,Timestamp,PM2.5,PM10,NO2,SO2,CO,O3
 */
export function formatOpenMeteoCsv(
  stationName: string,
  aqiData: OpenMeteoAirQualityPayload
): string {
  const current = aqiData?.current || {};
  const hourly = aqiData?.hourly || {};

  const currentPM25 = typeof current.pm2_5 === 'number' ? +(current.pm2_5.toFixed(1)) : null;
  const currentPM10 = typeof current.pm10 === 'number' ? +(current.pm10.toFixed(1)) : null;
  const currentNO2 = typeof current.nitrogen_dioxide === 'number' ? +(current.nitrogen_dioxide.toFixed(1)) : null;
  const currentSO2 = typeof current.sulphur_dioxide === 'number' ? +(current.sulphur_dioxide.toFixed(1)) : null;
  const currentCO = typeof current.carbon_monoxide === 'number' ? +(current.carbon_monoxide / 1000).toFixed(2) : null;
  const currentO3 = typeof current.ozone === 'number' ? +(current.ozone.toFixed(1)) : null;
  const currentTime = current.time ? current.time.replace('T', ' ') : new Date().toISOString().slice(0, 16).replace('T', ' ');

  const csvRows: string[] = ['Station,Timestamp,PM2.5,PM10,NO2,SO2,CO,O3'];
  const safeStation = (stationName || 'Monitoring Station').replace(/[,;]/g, ' ');

  const times = hourly.time || [];
  const hoursToInclude = Math.min(24, times.length);

  for (let i = 0; i < hoursToInclude; i++) {
    const rawTime = times[i];
    const timeStr = rawTime ? rawTime.replace('T', ' ') : '';
    const pm25 = hourly.pm2_5?.[i] !== undefined && hourly.pm2_5?.[i] !== null ? (+hourly.pm2_5[i]!).toFixed(1) : '';
    const pm10 = hourly.pm10?.[i] !== undefined && hourly.pm10?.[i] !== null ? (+hourly.pm10[i]!).toFixed(1) : '';
    const no2 = hourly.nitrogen_dioxide?.[i] !== undefined && hourly.nitrogen_dioxide?.[i] !== null ? (+hourly.nitrogen_dioxide[i]!).toFixed(1) : '';
    const so2 = hourly.sulphur_dioxide?.[i] !== undefined && hourly.sulphur_dioxide?.[i] !== null ? (+hourly.sulphur_dioxide[i]!).toFixed(1) : '';
    const co = hourly.carbon_monoxide?.[i] !== undefined && hourly.carbon_monoxide?.[i] !== null ? ((+hourly.carbon_monoxide[i]!) / 1000).toFixed(2) : '';
    const o3 = hourly.ozone?.[i] !== undefined && hourly.ozone?.[i] !== null ? (+hourly.ozone[i]!).toFixed(1) : '';

    csvRows.push(`${safeStation},${timeStr},${pm25},${pm10},${no2},${so2},${co},${o3}`);
  }

  // Fallback if hourly series was empty
  if (csvRows.length === 1) {
    csvRows.push(
      `${safeStation},${currentTime},${currentPM25 ?? ''},${currentPM10 ?? ''},${currentNO2 ?? ''},${currentSO2 ?? ''},${currentCO ?? ''},${currentO3 ?? ''}`
    );
  }

  return csvRows.join('\n');
}
