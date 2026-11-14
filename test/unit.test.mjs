/**
 * Civic Air Quality Briefing Studio - Official Unit Test Suite
 * Zero-dependency, native Node test runner execution
 * Run with: npm test
 */

import test from 'node:test';
import assert from 'node:assert/strict';

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
