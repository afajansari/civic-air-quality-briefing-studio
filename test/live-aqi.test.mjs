/**
 * Live India AQI API & Parser Integration Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Live AQI: Delhi (Default & Anand Vihar preset resolution)', async () => {
  // Test direct Open-Meteo Air Quality integration with coordinates for Delhi Anand Vihar
  const lat = 28.6469;
  const lon = 77.3160;
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=Asia%2FKolkata`;

  const res = await fetch(url);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.ok(data.current, 'Current telemetry should be present');
  assert.ok(typeof data.current.pm2_5 === 'number' || data.current.pm2_5 === null);
  assert.ok(typeof data.current.pm10 === 'number' || data.current.pm10 === null);
  assert.ok(typeof data.current.carbon_monoxide === 'number' || data.current.carbon_monoxide === null);
  assert.ok(data.hourly.time.length >= 24, 'Hourly series should have at least 24 hours');

  // Verify CSV formatting logic
  const stationName = 'Anand Vihar CAAQMS';
  const csvRows = ['Station,Timestamp,PM2.5,PM10,NO2,SO2,CO,O3'];
  for (let i = 0; i < 24; i++) {
    const timeStr = data.hourly.time[i].replace('T', ' ');
    const pm25 = data.hourly.pm2_5[i] ?? '';
    const pm10 = data.hourly.pm10[i] ?? '';
    const no2 = data.hourly.nitrogen_dioxide[i] ?? '';
    const so2 = data.hourly.sulphur_dioxide[i] ?? '';
    const co = data.hourly.carbon_monoxide[i] !== null ? (data.hourly.carbon_monoxide[i] / 1000).toFixed(2) : '';
    const o3 = data.hourly.ozone[i] ?? '';
    csvRows.push(`${stationName},${timeStr},${pm25},${pm10},${no2},${so2},${co},${o3}`);
  }

  const csv = csvRows.join('\n');
  assert.equal(csvRows.length, 25, 'Header + 24 hourly rows');
  assert.ok(csv.includes('Anand Vihar CAAQMS,'));
  assert.ok(csv.startsWith('Station,Timestamp,PM2.5,PM10,NO2,SO2,CO,O3'));
});

test('Live AQI Geocoding: Indian town resolution', async () => {
  const queryCity = 'Bhopal';
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryCity)}&country=India&count=1&language=en&format=json`;

  const res = await fetch(geoUrl);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.ok(data.results && data.results.length > 0, 'Bhopal should be geocoded');
  const first = data.results[0];
  assert.equal(first.name, 'Bhopal');
  assert.equal(first.country, 'India');
  assert.ok(first.latitude > 23 && first.latitude < 24);
  assert.ok(first.longitude > 77 && first.longitude < 78);
});

test('Live AQI Geocoding: Fails gracefully for non-existent place', async () => {
  const queryCity = 'NonExistentPlaceXYZ999';
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryCity)}&country=India&count=1&language=en&format=json`;

  const res = await fetch(geoUrl);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.ok(!data.results || data.results.length === 0, 'Non-existent place should have no results');
});

test('Security Headers Contract: next.config.mjs omits deprecated browsing-topics and enforces Permissions-Policy', async () => {
  const nextConfigModule = await import('../next.config.mjs');
  const nextConfig = nextConfigModule.default;
  const headersList = await nextConfig.headers();
  const rootHeaderConfig = headersList.find(h => h.source === '/:path*');
  assert.ok(rootHeaderConfig, 'Root path security header configuration must exist');

  const permPolicy = rootHeaderConfig.headers.find(h => h.key === 'Permissions-Policy');
  assert.ok(permPolicy, 'Permissions-Policy header must be defined');
  assert.ok(!permPolicy.value.includes('browsing-topics'), 'Permissions-Policy must not contain deprecated browsing-topics');
  assert.equal(permPolicy.value, 'camera=(), microphone=(), geolocation=()');

  // Verify other standard hardening headers
  const csp = rootHeaderConfig.headers.find(h => h.key === 'Content-Security-Policy');
  assert.ok(csp && csp.value.includes("default-src 'self'"), 'CSP header must be defined');
  const hsts = rootHeaderConfig.headers.find(h => h.key === 'Strict-Transport-Security');
  assert.ok(hsts && hsts.value.includes('max-age=63072000'), 'HSTS header must be defined');
  const frameOptions = rootHeaderConfig.headers.find(h => h.key === 'X-Frame-Options');
  assert.equal(frameOptions?.value, 'SAMEORIGIN');
  const contentType = rootHeaderConfig.headers.find(h => h.key === 'X-Content-Type-Options');
  assert.equal(contentType?.value, 'nosniff');
});

test('Live AQI Route Contract: 15-min ISR caching & Cache-Control headers', () => {
  const pagesRoute = path.resolve(__dirname, '../src/pages/api/live-aqi.ts');
  const appRoute = path.resolve(__dirname, '../src/app/api/live-aqi/route.ts');
  const routePath = fs.existsSync(pagesRoute) ? pagesRoute : appRoute;
  assert.ok(fs.existsSync(routePath), 'Live AQI route handler must exist');
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
    routeContent.includes("'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800'") ||
    routeContent.includes("res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800')"),
    'Route must return Cache-Control: public, s-maxage=900, stale-while-revalidate=1800'
  );
});

test('Frontend Accessibility & Form Handling Contract: DataIngestion.tsx', () => {
  const componentPath = path.resolve(__dirname, '../src/components/DataIngestion.tsx');
  assert.ok(fs.existsSync(componentPath), 'DataIngestion.tsx must exist');
  const content = fs.readFileSync(componentPath, 'utf8');

  // Verify aria-busy attribute on search form
  assert.ok(
    content.includes('aria-busy={liveLoading}'),
    'Form must bind aria-busy={liveLoading}'
  );

  // Verify onSubmit guard against concurrent requests
  assert.ok(
    content.includes('if (liveLoading || !searchCity.trim()) return;'),
    'Form onSubmit must guard against liveLoading and empty input'
  );

  // Verify interactive loading spinner inside input
  assert.ok(
    content.includes('Loader2') && content.includes('animate-spin text-emerald-400') ||
    content.includes('Loader2 className="w-4 h-4 text-emerald-400 animate-spin'),
    'Input must display Loader2 spinner during liveLoading'
  );

  // Verify disabled state on input during loading
  assert.ok(
    content.includes('disabled={liveLoading}'),
    'Search input must be disabled during liveLoading'
  );

  // Verify WCAG AA contrast enhancements
  assert.ok(
    content.includes('placeholder:text-slate-400'),
    'Search input placeholder must use text-slate-400 for WCAG AA contrast'
  );
  assert.ok(
    content.includes('disabled:bg-slate-800 disabled:text-slate-400 disabled:border-slate-700'),
    'Disabled styles must meet WCAG AA contrast standards'
  );

  // Verify sr-only polite live region
  assert.ok(
    content.includes('aria-live="polite" className="sr-only"'),
    'Polite screen reader live region must be declared'
  );

  // Verify station chip selection bug fix (exact comparison avoiding all-Delhi highlight)
  assert.ok(
    content.includes("stn === 'Delhi (Anand Vihar)'"),
    'Station chip selection must specifically isolate Delhi (Anand Vihar) when Delhi is selected'
  );
  assert.ok(
    !content.includes('stn.includes(selectedStation) && selectedStation.length > 3'),
    'Multi-Delhi highlight bug condition must be removed'
  );
});

test('Client Hydration & Error Retry Contract: page.tsx / index.tsx', () => {
  const pagesPath = path.resolve(__dirname, '../src/pages/index.tsx');
  const appPath = path.resolve(__dirname, '../src/app/page.tsx');
  const pagePath = fs.existsSync(pagesPath) ? pagesPath : appPath;
  assert.ok(fs.existsSync(pagePath), 'index.tsx or page.tsx must exist');
  const content = fs.readFileSync(pagePath, 'utf8');

  // Verify client hydration guard
  assert.ok(
    content.includes('const [isMounted, setIsMounted] = useState<boolean>(false)') ||
    content.includes('const [isMounted, setIsMounted] = useState(false)'),
    'page.tsx must define isMounted client hydration guard'
  );
  assert.ok(
    content.includes('setIsMounted(true)'),
    'page.tsx must set isMounted to true in useEffect'
  );

  // Verify noscript guidance for non-JS environments
  assert.ok(
    content.includes('<noscript>') && content.includes('</noscript>'),
    'page.tsx must provide noscript guidance'
  );

  // Verify Retry Connection button in error banner
  assert.ok(
    content.includes('Retry Connection'),
    'page.tsx error alert must include a Retry Connection button'
  );

  // Verify resetting briefing state upon city or station change
  assert.ok(
    content.includes('setCurrentBrief(null)'),
    'page.tsx must reset currentBrief to null upon city/station change'
  );
});
