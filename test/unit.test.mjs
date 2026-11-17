/**
 * Civic Air Quality Briefing Studio - Official Unit Test Suite
 * Zero-dependency, native Node test runner execution
 * Run with: npm test
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import pure TypeScript logic or test modules
// 1. AQI Breakpoints & Calculation
const CPCB_BREAKPOINTS = {
  pm25: [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 }
  ]
};

function calculateSubIndex(conc, pollutant) {
  if (conc === null || conc === undefined || isNaN(conc) || conc < 0) return null;
  const bps = CPCB_BREAKPOINTS[pollutant];
  if (!bps) return null;
  for (const bp of bps) {
    if (conc >= bp.cLow && conc <= bp.cHigh) {
      return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (conc - bp.cLow) + bp.iLow);
    }
  }
  if (conc > 500) return 500;
  return null;
}

function detectDelimiter(text) {
  const firstLine = text.trim().split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const pipeCount = (firstLine.match(/\|/g) || []).length;
  if (tabCount > commaCount && tabCount > semiCount && tabCount > pipeCount) return '\t';
  if (semiCount > commaCount && semiCount > tabCount && semiCount > pipeCount) return ';';
  if (pipeCount > commaCount && pipeCount > tabCount && pipeCount > semiCount) return '|';
  return ',';
}

function extractNumericAndUnit(rawVal, headerUnitHint = '') {
  if (rawVal === null || rawVal === undefined) return { value: null, unit: null, isMissing: true };
  const str = String(rawVal).trim();
  if (['', 'na', 'n/a', 'nan', 'null', 'nil', '-', '--', 'nd'].includes(str.toLowerCase())) {
    return { value: null, unit: null, isMissing: true };
  }
  const unitMatch = str.match(/(µg\/m[3³]|ug\/m[3³]|ppb|ppm|mg\/m[3³]|%|°c|c|m\/s|km\/h)/i);
  const detectedUnit = unitMatch ? unitMatch[0].toLowerCase() : headerUnitHint;
  const numMatch = str.match(/[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/);
  if (!numMatch) return { value: null, unit: detectedUnit || null, isMissing: true };
  let num = parseFloat(numMatch[0]);
  if (detectedUnit.includes('ppm') && headerUnitHint.includes('mg')) {
    num = num * 1.15;
  }
  return { value: num, unit: detectedUnit || null, isMissing: false };
}

function resolveOpenRouterModel(model) {
  if (model.includes('/')) {
    if (model.includes('gemini-flash-1.5') || model.includes('gemini-2.0-flash-exp')) {
      return 'google/gemini-2.5-flash';
    }
    return model;
  }
  if (model.includes('lite')) return 'google/gemini-2.5-flash-lite';
  if (model.includes('pro')) return 'google/gemini-2.5-pro';
  return 'google/gemini-2.5-flash';
}

// -----------------------------------------------------------------------------
// Test Suites
// -----------------------------------------------------------------------------

test('AQI Engine: Breakpoint Interpolation & Clamping', () => {
  // Test Good tier
  const goodIdx = calculateSubIndex(20, 'pm25');
  assert.equal(goodIdx, 33);

  // Test Moderate tier
  const modIdx = calculateSubIndex(75, 'pm25');
  assert.equal(modIdx, 149);

  // Test Severe tier
  const severeIdx = calculateSubIndex(300, 'pm25');
  assert.equal(severeIdx, 420);

  // Test clamping > 500
  const maxIdx = calculateSubIndex(800, 'pm25');
  assert.equal(maxIdx, 500);

  // Test invalid/negative values
  assert.equal(calculateSubIndex(-5, 'pm25'), null);
  assert.equal(calculateSubIndex(NaN, 'pm25'), null);
});

test('Parser: Auto-Delimiter Detection', () => {
  assert.equal(detectDelimiter('Station,Timestamp,PM2.5\nRohini,10:00,150'), ',');
  assert.equal(detectDelimiter('Station\tTimestamp\tPM2.5\nRohini\t10:00\t150'), '\t');
  assert.equal(detectDelimiter('Station;Timestamp;PM2.5\nRohini;10:00;150'), ';');
  assert.equal(detectDelimiter('Station|Timestamp|PM2.5\nRohini|10:00|150'), '|');
});

test('Parser: Messy Unit Extraction & Normalization', () => {
  const normal = extractNumericAndUnit('142.5 µg/m3');
  assert.equal(normal.value, 142.5);
  assert.equal(normal.isMissing, false);

  const missingVal = extractNumericAndUnit('N/A');
  assert.equal(missingVal.value, null);
  assert.equal(missingVal.isMissing, true);

  const dashVal = extractNumericAndUnit('--');
  assert.equal(dashVal.isMissing, true);

  const ppmConversion = extractNumericAndUnit('2.0 ppm', 'mg/m3');
  assert.equal(ppmConversion.value, 2.3);
});

test('OpenRouter Model Resolution & Auto-Upgrade', () => {
  // Obsolete model auto-upgrade to Gemini 2.5
  assert.equal(resolveOpenRouterModel('google/gemini-flash-1.5'), 'google/gemini-2.5-flash');
  assert.equal(resolveOpenRouterModel('google/gemini-2.0-flash-exp:free'), 'google/gemini-2.5-flash');

  // Flash / Pro / Lite mappings
  assert.equal(resolveOpenRouterModel('gemini-1.5-flash'), 'google/gemini-2.5-flash');
  assert.equal(resolveOpenRouterModel('gemini-1.5-pro'), 'google/gemini-2.5-pro');
  assert.equal(resolveOpenRouterModel('gemini-flash-lite'), 'google/gemini-2.5-flash-lite');

  // Direct active slug preservation
  assert.equal(resolveOpenRouterModel('google/gemini-2.5-flash-lite'), 'google/gemini-2.5-flash-lite');
  assert.equal(resolveOpenRouterModel('openrouter/free'), 'openrouter/free');
});

test('Delta Engine: AQI Comparison Math & Trend', () => {
  function compareSimple(currAqi, prevAqi) {
    const diff = currAqi - prevAqi;
    const trend = diff > 5 ? 'worsening' : diff < -5 ? 'improving' : 'stable';
    return { diff, trend };
  }

  const worsened = compareSimple(350, 280);
  assert.equal(worsened.diff, 70);
  assert.equal(worsened.trend, 'worsening');

  const improved = compareSimple(190, 260);
  assert.equal(improved.diff, -70);
  assert.equal(improved.trend, 'improving');

  const stable = compareSimple(152, 150);
  assert.equal(stable.diff, 2);
  assert.equal(stable.trend, 'stable');
});

test('India Cities: Predefined Roster & Coordinates Resolution', async () => {
  const { INDIAN_CITIES, findCityCoordinates, REGIONAL_CHIPS } = await import('../src/lib/india-cities.ts');

  // Verify list completeness
  assert.ok(INDIAN_CITIES.length >= 20, 'Should contain at least 20 predefined cities/stations');

  // Delhi & NCR stations
  const anandVihar = findCityCoordinates('Anand Vihar');
  assert.ok(anandVihar, 'Anand Vihar must be found');
  assert.equal(anandVihar.city, 'Delhi');
  assert.equal(anandVihar.region, 'NCR');
  assert.ok(anandVihar.lat > 28 && anandVihar.lat < 29);
  assert.ok(anandVihar.lon > 77 && anandVihar.lon < 78);

  const rohini = findCityCoordinates('delhi rohini');
  assert.ok(rohini, 'Delhi Rohini must be found');
  assert.equal(rohini.id, 'delhi-rohini');

  const igi = findCityCoordinates('IGI Airport');
  assert.ok(igi, 'IGI Airport must be found');
  assert.equal(igi.id, 'delhi-igi-airport');

  const rkPuram = findCityCoordinates('rk puram');
  assert.ok(rkPuram, 'RK Puram must be found');
  assert.equal(rkPuram.id, 'delhi-rk-puram');

  const delhi = findCityCoordinates('delhi');
  assert.ok(delhi, 'General Delhi must be found');
  assert.equal(delhi.city, 'Delhi');

  // Mumbai stations
  const bandra = findCityCoordinates('Bandra');
  assert.ok(bandra, 'Mumbai Bandra must be found');
  assert.equal(bandra.region, 'West');

  const colaba = findCityCoordinates('mumbai colaba');
  assert.ok(colaba, 'Mumbai Colaba must be found');
  assert.equal(colaba.city, 'Mumbai');

  // Bengaluru, Kolkata, Chennai, Hyderabad
  const btm = findCityCoordinates('bengaluru btm');
  assert.ok(btm, 'Bengaluru BTM must be found');
  assert.equal(btm.region, 'South');

  const kolkata = findCityCoordinates('Victoria Memorial');
  assert.ok(kolkata, 'Kolkata Victoria Memorial must be found');
  assert.equal(kolkata.region, 'North & East');

  const alandur = findCityCoordinates('Alandur');
  assert.ok(alandur, 'Chennai Alandur must be found');
  assert.equal(alandur.region, 'South');

  const sanathnagar = findCityCoordinates('Sanathnagar');
  assert.ok(sanathnagar, 'Hyderabad Sanathnagar must be found');
  assert.equal(sanathnagar.region, 'South');

  // Tier-1/2 Cities: Ahmedabad, Pune, Lucknow, Kanpur, Patna, Jaipur, Varanasi, Chandigarh
  ['ahmedabad', 'pune', 'lucknow', 'kanpur', 'patna', 'jaipur', 'varanasi', 'chandigarh'].forEach(city => {
    const res = findCityCoordinates(city);
    assert.ok(res, `City "${city}" must be resolvable`);
    assert.ok(res.lat !== 0 && res.lon !== 0);
  });

  // Negative test: non-existent location returns null
  assert.equal(findCityCoordinates('Atlantis'), null);
  assert.equal(findCityCoordinates(''), null);

  // Regional chips validation
  assert.ok(REGIONAL_CHIPS.some(rc => rc.region === 'NCR'));
  assert.ok(REGIONAL_CHIPS.some(rc => rc.region === 'West'));
  assert.ok(REGIONAL_CHIPS.some(rc => rc.region === 'South'));
  assert.ok(REGIONAL_CHIPS.some(rc => rc.region === 'North & East'));
});

test('Indian CAAQMS Datasets: Replaced Foreign Datasets', async () => {
  const { INDIAN_DATASETS, AUTHENTIC_DATASETS } = await import('../src/lib/authentic-datasets.ts');

  assert.equal(INDIAN_DATASETS.length, 4, 'Should contain 4 curated Indian presets');
  assert.equal(AUTHENTIC_DATASETS.length, 4);

  // Verify all datasets are Indian
  INDIAN_DATASETS.forEach(ds => {
    assert.ok(ds.location.includes('India'), `Dataset "${ds.name}" must be in India`);
    assert.equal(ds.defaultStandard, 'cpcb', `Dataset "${ds.name}" must use CPCB standard`);
    assert.ok(ds.csvData.startsWith('Station,Timestamp,'), 'Must have standard CSV header');
  });

  // Verify absence of obsolete foreign datasets
  assert.ok(!INDIAN_DATASETS.some(d => d.id === 'epa-california-wildfire'), 'Must not contain US EPA wildfire dataset');
  assert.ok(!INDIAN_DATASETS.some(d => d.id === 'london-marylebone-traffic'), 'Must not contain London Marylebone dataset');
});

test('India Cities: Fuzzy & Case-Insensitive Resolution (Delhi, Mumbai, Bengaluru)', async () => {
  const { findCityCoordinates } = await import('../src/lib/india-cities.ts');

  // Case-insensitivity tests
  const dUpper = findCityCoordinates('DELHI');
  assert.ok(dUpper, 'Upper-case DELHI should resolve');
  assert.equal(dUpper.city, 'Delhi');

  const mMixed = findCityCoordinates('MuMbAi');
  assert.ok(mMixed, 'Mixed-case MuMbAi should resolve');
  assert.equal(mMixed.city, 'Mumbai');

  const bLower = findCityCoordinates('bengaluru');
  assert.ok(bLower, 'Lower-case bengaluru should resolve');
  assert.equal(bLower.city, 'Bengaluru');

  // Specific station alias tests
  const anandViharAlias = findCityCoordinates('isbt anand vihar');
  assert.ok(anandViharAlias, 'ISBT Anand Vihar alias should resolve');
  assert.equal(anandViharAlias.station, 'Anand Vihar CAAQMS');

  const palamAirport = findCityCoordinates('palam');
  assert.ok(palamAirport, 'Palam airport alias should resolve to IGI');
  assert.equal(palamAirport.id, 'delhi-igi-airport');

  const bkc = findCityCoordinates('bkc');
  assert.ok(bkc, 'BKC alias should resolve to Bandra');
  assert.equal(bkc.id, 'mumbai-bandra');

  const bangalore = findCityCoordinates('bangalore');
  assert.ok(bangalore, 'Bangalore legacy spelling should resolve to Bengaluru');
  assert.equal(bangalore.city, 'Bengaluru');

  // Verify coordinates are bounded within Indian subcontinent
  [dUpper, mMixed, bLower].forEach(city => {
    assert.ok(city.lat >= 8 && city.lat <= 37, `${city.city} lat out of India bounds`);
    assert.ok(city.lon >= 68 && city.lon <= 97, `${city.city} lon out of India bounds`);
  });
});

test('Open-Meteo CSV Transformer: Validating 8-Column Format (Station, Timestamp, PM2.5, PM10, NO2, SO2, CO, O3)', async () => {
  const { formatOpenMeteoCsv } = await import('../src/lib/india-cities.ts');

  // Mock Open-Meteo Air Quality telemetry payload
  const mockPayload = {
    current: {
      time: '2026-11-17T12:00',
      pm10: 198.4,
      pm2_5: 145.2,
      carbon_monoxide: 1250, // in µg/m³
      nitrogen_dioxide: 48.6,
      sulphur_dioxide: 18.2,
      ozone: 32.1
    },
    hourly: {
      time: [
        '2026-11-17T00:00',
        '2026-11-17T01:00',
        '2026-11-17T02:00',
        '2026-11-17T03:00'
      ],
      pm10: [150.0, 162.5, null, 180.2],
      pm2_5: [92.4, 105.1, 110.0, 125.8],
      carbon_monoxide: [800, 950, 1100, 1400], // µg/m³ -> 0.80, 0.95, 1.10, 1.40 mg/m³
      nitrogen_dioxide: [35.2, 40.1, 45.0, 52.3],
      sulphur_dioxide: [12.0, 14.5, 15.0, 16.8],
      ozone: [18.4, 15.2, 12.0, 10.5]
    }
  };

  const csv = formatOpenMeteoCsv('Delhi (Anand Vihar)', mockPayload);

  // 1. Validate CSV header
  const lines = csv.trim().split(/\r?\n/);
  const expectedHeader = 'Station,Timestamp,PM2.5,PM10,NO2,SO2,CO,O3';
  assert.equal(lines[0], expectedHeader, 'Header must exactly match the 8 required columns');

  // 2. Validate row count: 1 header + 4 hourly rows
  assert.equal(lines.length, 5, 'Should produce exactly 1 header + 4 data rows');

  // 3. Validate column count on every line
  lines.forEach((line, idx) => {
    const cols = line.split(',');
    assert.equal(cols.length, 8, `Row ${idx} must contain exactly 8 columns`);
  });

  // 4. Validate unit conversion: CO must be converted from µg/m³ to mg/m³ (800 µg/m³ -> 0.80 mg/m³)
  const firstDataRowCols = lines[1].split(',');
  assert.equal(firstDataRowCols[0], 'Delhi (Anand Vihar)');
  assert.equal(firstDataRowCols[1], '2026-11-17 00:00'); // 'T' replaced with space
  assert.equal(firstDataRowCols[2], '92.4');  // PM2.5
  assert.equal(firstDataRowCols[3], '150.0'); // PM10
  assert.equal(firstDataRowCols[4], '35.2');  // NO2
  assert.equal(firstDataRowCols[5], '12.0');  // SO2
  assert.equal(firstDataRowCols[6], '0.80');  // CO in mg/m³
  assert.equal(firstDataRowCols[7], '18.4');  // O3

  // 5. Validate handling of null/missing values in row 3
  const thirdDataRowCols = lines[3].split(',');
  assert.equal(thirdDataRowCols[3], '', 'Null PM10 should format as empty string');
  assert.equal(thirdDataRowCols.length, 8, 'Null values must not break column alignment');

  // 6. Validate parser compatibility with PapaParse
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  assert.equal(parsed.errors.length, 0, 'PapaParse should parse CSV without any errors');
  assert.equal(parsed.data.length, 4, 'PapaParse should return 4 parsed record rows');
  assert.deepEqual(parsed.meta.fields, ['Station', 'Timestamp', 'PM2.5', 'PM10', 'NO2', 'SO2', 'CO', 'O3']);

  // 7. Validate fallback when hourly series is empty
  const fallbackCsv = formatOpenMeteoCsv('BTM Station', { current: mockPayload.current, hourly: {} });
  const fallbackLines = fallbackCsv.trim().split(/\r?\n/);
  assert.equal(fallbackLines.length, 2, 'Fallback should output header + 1 current telemetry row');
  assert.equal(fallbackLines[0], expectedHeader);
  const fallbackRow = fallbackLines[1].split(',');
  assert.equal(fallbackRow.length, 8);
  assert.equal(fallbackRow[0], 'BTM Station');
  assert.equal(fallbackRow[6], '1.25'); // 1250 µg/m³ -> 1.25 mg/m³
});

test('Verification: Zero Static Mock / Foreign Dataset Strings in Production Sources', () => {
  const rootSrcDir = path.resolve(__dirname, '..', 'src');
  assert.ok(fs.existsSync(rootSrcDir), 'src directory must exist');

  const forbiddenTerms = [
    'marylebone',
    'camp fire',
    'san jose - jackson',
    'oakland west',
    'fresno - garland',
    'bloomsbury',
    'california wildfire',
    'us epa california',
    'defra'
  ];

  const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.css']);
  const violations = [];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (sourceExtensions.has(ext)) {
          const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
          for (const term of forbiddenTerms) {
            if (content.includes(term)) {
              violations.push({
                file: path.relative(rootSrcDir, fullPath),
                term
              });
            }
          }
        }
      }
    }
  }

  scanDir(rootSrcDir);

  assert.deepEqual(
    violations,
    [],
    `Found forbidden foreign/mock dataset strings in production sources:\n${violations.map(v => `  - "${v.term}" in src/${v.file}`).join('\n')}`
  );
});

test('Security Headers: next.config.mjs omits deprecated browsing-topics and configures Permissions-Policy', async () => {
  const nextConfigModule = await import('../next.config.mjs');
  const nextConfig = nextConfigModule.default;
  const headersList = await nextConfig.headers();
  const rootHeaderConfig = headersList.find(h => h.source === '/:path*');
  assert.ok(rootHeaderConfig, 'Root path security header config must exist');

  const permPolicy = rootHeaderConfig.headers.find(h => h.key === 'Permissions-Policy');
  assert.ok(permPolicy, 'Permissions-Policy header must be defined');
  assert.ok(!permPolicy.value.includes('browsing-topics'), 'Permissions-Policy must not contain browsing-topics');
  assert.equal(permPolicy.value, 'camera=(), microphone=(), geolocation=()');
});

test('Live Telemetry Route Contract: 15-min ISR caching & edge Cache-Control headers', () => {
  const routePath = path.resolve(__dirname, '..', 'src', 'app', 'api', 'live-aqi', 'route.ts');
  assert.ok(fs.existsSync(routePath), 'src/app/api/live-aqi/route.ts must exist');
  const routeContent = fs.readFileSync(routePath, 'utf8');

  // Verify 15-minute ISR revalidation for air quality fetch
  assert.ok(
    routeContent.includes('next: { revalidate: 900 }'),
    'Air quality telemetry fetch must declare next: { revalidate: 900 }'
  );

  // Verify 24-hour caching for geocoding
  assert.ok(
    routeContent.includes('next: { revalidate: 86400 }'),
    'Geocoding fetch must declare next: { revalidate: 86400 }'
  );

  // Verify edge Cache-Control header
  assert.ok(
    routeContent.includes("'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800'"),
    'Route must return Cache-Control: public, s-maxage=900, stale-while-revalidate=1800'
  );
});

test('Frontend Form Accessibility & UI Polish Contract: DataIngestion.tsx', () => {
  const compPath = path.resolve(__dirname, '..', 'src', 'components', 'DataIngestion.tsx');
  assert.ok(fs.existsSync(compPath), 'DataIngestion.tsx must exist');
  const content = fs.readFileSync(compPath, 'utf8');

  // 1. Form onSubmit guard & aria-busy
  assert.ok(
    content.includes('aria-busy={liveLoading}'),
    'DataIngestion form must specify aria-busy={liveLoading}'
  );
  assert.ok(
    content.includes('if (liveLoading || !searchCity.trim()) return;'),
    'Form onSubmit must prevent duplicate in-flight queries'
  );

  // 2. Input spinner & disabled state
  assert.ok(
    content.includes('Loader2') && content.includes('animate-spin text-emerald-400') ||
    content.includes('Loader2 className="w-4 h-4 text-emerald-400 animate-spin'),
    'Search input must display Loader2 spinner during active liveLoading'
  );
  assert.ok(
    content.includes('disabled={liveLoading}'),
    'Input must be disabled during liveLoading'
  );

  // 3. WCAG AA color contrast
  assert.ok(
    content.includes('placeholder:text-slate-400'),
    'Input must use placeholder:text-slate-400 for WCAG AA compliance'
  );
  assert.ok(
    content.includes('disabled:bg-slate-800 disabled:text-slate-400 disabled:border-slate-700'),
    'Disabled styling must use accessible slate-400/slate-800 palette'
  );

  // 4. Polite screen reader announcements
  assert.ok(
    content.includes('aria-live="polite" className="sr-only"'),
    'sr-only polite live region must announce search / loading status'
  );

  // 5. Regional chip exact highlight
  assert.ok(
    content.includes("selectedStation.toLowerCase() === 'delhi' && stn === 'Delhi (Anand Vihar)'"),
    'Station chip comparison must isolate Anand Vihar when Delhi is selected'
  );
});

test('Client Hydration Guard & Stabilization Contract: page.tsx', () => {
  const pagePath = path.resolve(__dirname, '..', 'src', 'app', 'page.tsx');
  assert.ok(fs.existsSync(pagePath), 'page.tsx must exist');
  const content = fs.readFileSync(pagePath, 'utf8');

  // 1. isMounted hydration guard
  assert.ok(
    content.includes('const [isMounted, setIsMounted] = useState<boolean>(false)') ||
    content.includes('const [isMounted, setIsMounted] = useState(false)'),
    'page.tsx must define isMounted client hydration guard'
  );
  assert.ok(
    content.includes('setIsMounted(true)'),
    'page.tsx must set isMounted to true in mount useEffect'
  );

  // 2. noscript guidance
  assert.ok(
    content.includes('<noscript>') && content.includes('JavaScript'),
    'page.tsx must contain noscript fallback message'
  );

  // 3. Error retry button
  assert.ok(
    content.includes('Retry Connection'),
    'Error alert banner must provide Retry Connection button'
  );

  // 4. Resetting currentBrief on city/station change
  assert.ok(
    content.includes('setCurrentBrief(null)'),
    'page.tsx must reset currentBrief on station change'
  );
});
