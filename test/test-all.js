/**
 * Civic Air Quality Briefing Studio - Comprehensive Verification Test Suite
 * Tests AQI calculation, messy data ingestion, anomaly detection, comparison, and localization.
 */

const assert = require('assert');
const { calculateSubIndex, calculateOverallAQI, getAQICategory } = require('../lib/aqi-engine');
const { parseMessyData, detectDelimiter } = require('../lib/parser');
const { compareBriefs } = require('../lib/brief-comparator');
const { generateLocalizedAdvisory } = require('../lib/translator');
const { AUTHENTIC_DATASETS } = require('../lib/authentic-datasets');
const { generateCivicBrief } = require('../lib/ai-service');

console.log('--- RUNNING CIVIC AIR QUALITY STUDIO TEST SUITE ---');

// Test 1: AQI Engine (CPCB & EPA)
console.log('Test 1: AQI Calculation...');
const cpcbAqi = calculateOverallAQI({ pm25: 140, pm10: 280 }, 'cpcb');
assert(cpcbAqi.aqi >= 300, `Expected CPCB AQI >= 300, got ${cpcbAqi.aqi}`);
assert(cpcbAqi.category === 'Very Poor' || cpcbAqi.category === 'Severe', `Category should be Very Poor or Severe, got ${cpcbAqi.category}`);

const epaAqi = calculateOverallAQI({ pm25: 65 }, 'epa');
assert(epaAqi.aqi >= 151 && epaAqi.aqi <= 200, `Expected EPA AQI in Unhealthy range (151-200), got ${epaAqi.aqi}`);
assert(epaAqi.category === 'Unhealthy', `Expected Unhealthy, got ${epaAqi.category}`);

// Test 2: Delimiter Detection
console.log('Test 2: Delimiter Detection...');
assert.strictEqual(detectDelimiter('a,b,c\n1,2,3'), ',');
assert.strictEqual(detectDelimiter('a\tb\tc\n1\t2\t3'), '\t');
assert.strictEqual(detectDelimiter('a;b;c\n1;2;3'), ';');

// Test 3: Messy Data Parsing & Header Aliasing
console.log('Test 3: Messy Data Parsing...');
const messyInput = `
location;observed_at;PM2.5 (ug/m3);coarse_pm;no2_ppb
Ward Alpha;2026-11-14 08:00;45.5 ug/m3;90.2;35 ppb
Ward Alpha;2026-11-14 09:00;-2.1 ug/m3;N/A;40 ppb
Ward Beta;2026-11-14 08:00;120.4 ug/m3;210.5;55 ppb
Ward Beta;2026-11-14 09:00;120.4 ug/m3;210.5;55 ppb
Ward Beta;2026-11-14 10:00;120.4 ug/m3;210.5;55 ppb
Ward Beta;2026-11-14 11:00;120.4 ug/m3;210.5;55 ppb
`;

const parsed = parseMessyData(messyInput, 'cpcb');
assert(parsed.success, 'Parsing should succeed');
assert.strictEqual(parsed.records.length, 6, `Expected 6 records, got ${parsed.records.length}`);
assert(parsed.stations.length === 2, `Expected 2 stations, got ${parsed.stations.length}`);

// Test 4: Anomaly Detection (Negative Drift & Sensor Freeze)
console.log('Test 4: Anomaly Detection...');
const negativeAnomaly = parsed.anomalies.find(a => a.type.includes('Negative Value'));
assert(negativeAnomaly, 'Should flag negative drift anomaly');

const freezeAnomaly = parsed.anomalies.find(a => a.type.includes('Sensor Freeze'));
assert(freezeAnomaly, 'Should flag sensor freeze for Ward Beta');

// Test 5: Authentic Datasets Loading
console.log('Test 5: Authentic Real Datasets...');
const delhiData = parseMessyData(AUTHENTIC_DATASETS.delhi_winter_cpcb.content, 'cpcb');
assert(delhiData.success, 'Delhi dataset should parse cleanly');
assert(delhiData.records.length > 20, 'Delhi dataset should have over 20 records');
assert(delhiData.summary.averageAQI > 250, 'Delhi winter smog should have severe AQI');

// Test 6: Brief Comparison Engine
console.log('Test 6: Brief Comparison...');
const briefA = {
  id: 'brief_1',
  summary: { averageAQI: 180, peakAQI: 220, category: 'Moderate' },
  stations: [
    { station: 'Ward 1', averageAQI: 180, peakAQI: 220, isHotspot: false, category: 'Moderate' }
  ],
  dataGaps: [],
  anomalies: [],
  completenessPercent: 95
};
const briefB = {
  id: 'brief_2',
  summary: { averageAQI: 245, peakAQI: 310, category: 'Poor' },
  stations: [
    { station: 'Ward 1', averageAQI: 245, peakAQI: 310, isHotspot: true, category: 'Poor' }
  ],
  dataGaps: [{ detail: '1 hr gap' }],
  anomalies: [],
  completenessPercent: 90
};

const diff = compareBriefs(briefB, briefA);
assert.strictEqual(diff.hasPrevious, true);
assert.strictEqual(diff.aqiDelta, 65);
assert.strictEqual(diff.aqiTrend, 'worsening');
assert(diff.hotspots.newlyEmerged.includes('Ward 1'), 'Ward 1 should be newly emerged hotspot');

// Test 7: Multi-Language & Reading Level Advisory
console.log('Test 7: Multi-Language & Reading Level Generation...');
const advisoryHindi = generateLocalizedAdvisory(delhiData, 'hi', 'simple');
assert.strictEqual(advisoryHindi.language, 'Hindi');
assert(advisoryHindi.summary.includes('AQI'), 'Hindi advisory should contain AQI');
assert(advisoryHindi.sections.children.tips.length > 0, 'Children advisory should have tips');
assert(advisoryHindi.sections.seniors.tips.length > 0, 'Seniors advisory should have tips');

const advisorySpanish = generateLocalizedAdvisory(delhiData, 'es', 'general');
assert.strictEqual(advisorySpanish.language, 'Spanish');

// Test 8: End-to-End Civic Brief Generation (Deterministic Fallback)
console.log('Test 8: End-to-End Brief Generation...');
(async () => {
  const fullBrief = await generateCivicBrief(delhiData, {
    persona: 'ward_officer',
    language: 'en',
    readingLevel: 'general'
  });

  assert(fullBrief.summary, 'Brief must contain summary');
  assert(fullBrief.internalBriefingNote.prioritizedActions.length >= 3, 'Must have prioritized actions');
  assert(fullBrief.citizenAdvisory.sections.children, 'Must have children section');
  assert(fullBrief.citizenAdvisory.sections.seniors, 'Must have seniors section');
  assert(fullBrief.traceabilityList.length > 0, 'Must have traceability citations');

  console.log('ALL TESTS PASSED SUCCESSFULLY! (8/8)');
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
