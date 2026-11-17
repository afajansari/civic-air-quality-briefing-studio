/**
 * Live India AQI API & Parser Integration Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';

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
