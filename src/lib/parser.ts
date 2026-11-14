/**
 * Civic Air Quality Briefing Studio - Messy Table Ingestion & Anomaly Parser
 * Handles messy formats, inconsistent column naming, mixed units, missing readings,
 * and detects data gaps & sensor reliability issues.
 */

import { calculateOverallAQI } from './aqi-engine';
import {
  AqiStandard,
  AirQualityRecord,
  DataAnomaly,
  DataGap,
  ParsedDataSet,
  ReadingIssue,
  StationSummary,
  PollutantValues
} from '../types';

export const COLUMN_ALIASES: Record<string, string[]> = {
  station: [
    'station', 'station_name', 'site', 'location', 'ward', 'zone', 'area',
    'housing_society', 'society', 'sensor_id', 'sensor', 'device', 'device_id',
    'monitor', 'neighborhood', 'address', 'point', 'stationname'
  ],
  timestamp: [
    'timestamp', 'datetime', 'date_time', 'date', 'time', 'recorded_at',
    'reading_time', 'epoch', 'sampling_time', 'time_stamp', 'observed_at',
    'created_at', 'dt', 'period', 'hour'
  ],
  pm25: [
    'pm25', 'pm2_5', 'pm2.5', 'pm 2.5', 'particulate matter 2.5', 'fine_pm',
    'pm25_atm', 'pm2.5 (ug/m3)', 'pm2.5_ugm3', 'pm25_conc', 'pm25_ug_m3',
    'pm25_standard', 'pm25_env', 'pm2.5_µg/m³', 'particulate_matter_2_5'
  ],
  pm10: [
    'pm10', 'pm_10', 'pm 10', 'coarse_pm', 'particulate matter 10',
    'pm10 (ug/m3)', 'pm10_ugm3', 'pm10_conc', 'pm10_ug_m3', 'pm10_standard',
    'pm10_µg/m³', 'particulate_matter_10'
  ],
  no2: [
    'no2', 'nitrogen_dioxide', 'no2 (ug/m3)', 'no2_ppb', 'no2_ugm3',
    'no2_ppm', 'no2 (ppb)', 'no2_conc'
  ],
  so2: [
    'so2', 'sulfur_dioxide', 'so2 (ug/m3)', 'so2_ppb', 'so2_ugm3',
    'so2_ppm', 'so2 (ppb)'
  ],
  co: [
    'co', 'carbon_monoxide', 'co (mg/m3)', 'co_ppm', 'co_mgm3',
    'co (ppm)', 'co_conc'
  ],
  o3: [
    'o3', 'ozone', 'o3 (ug/m3)', 'o3_ppb', 'o3_ugm3', 'o3 (ppb)'
  ],
  aqi: [
    'aqi', 'us_aqi', 'air_quality_index', 'cpcb_aqi', 'naqi', 'overall_aqi'
  ],
  temperature: [
    'temp', 'temperature', 't_c', 'temp_c', 'ambient_temp'
  ],
  humidity: [
    'humidity', 'rh', 'relative_humidity', 'humid'
  ],
  wind_speed: [
    'wind_speed', 'wind', 'ws', 'wind_velocity'
  ]
};

export function detectDelimiter(text: string): string {
  const firstLines = text.split(/\r?\n/).filter(l => l.trim().length > 0).slice(0, 5);
  if (firstLines.length === 0) return ',';

  const sample = firstLines.join('\n');
  const counts: Record<string, number> = {
    ',': (sample.match(/,/g) || []).length,
    '\t': (sample.match(/\t/g) || []).length,
    ';': (sample.match(/;/g) || []).length,
    '|': (sample.match(/\|/g) || []).length
  };

  let bestDelim = ',';
  let maxCount = -1;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      bestDelim = delim;
    }
  }
  return maxCount > 0 ? bestDelim : ',';
}

export function normalizeHeaderName(header: string): string {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[\s\-_]+/g, '_')
    .replace(/[()µ\/\.]/g, '');
}

export function matchCanonicalKey(rawHeader: string): string | null {
  const norm = normalizeHeaderName(rawHeader);
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const normAlias = normalizeHeaderName(alias);
      if (norm === normAlias || norm.includes(normAlias)) {
        return canonical;
      }
    }
  }
  return null;
}

export function extractNumericAndUnit(rawVal: unknown, headerUnitHint = ''): { value: number | null; unit: string | null; isMissing: boolean } {
  if (rawVal === null || rawVal === undefined) return { value: null, unit: null, isMissing: true };

  const str = String(rawVal).trim();
  if (['', 'na', 'n/a', 'nan', 'null', 'nil', '-', '--', 'nd', 'none'].includes(str.toLowerCase())) {
    return { value: null, unit: null, isMissing: true };
  }

  const unitMatch = str.match(/(µg\/m[3³]|ug\/m[3³]|ppb|ppm|mg\/m[3³]|%|°c|c|m\/s|km\/h)/i);
  const detectedUnit = unitMatch ? unitMatch[0].toLowerCase() : headerUnitHint;

  const numMatch = str.match(/[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/);
  if (!numMatch) {
    return { value: null, unit: detectedUnit || null, isMissing: true };
  }

  let num = parseFloat(numMatch[0]);

  if (detectedUnit.includes('ppm') && headerUnitHint.includes('mg')) {
    num = num * 1.15;
  }

  return {
    value: num,
    unit: detectedUnit || null,
    isMissing: false
  };
}

export function standardizeTimestamp(rawTime: unknown, rowIndex: number): { formatted: string; iso: string | null; epoch: number | null; inferred: boolean } {
  if (!rawTime) {
    return {
      formatted: `Reading #${rowIndex + 1}`,
      iso: null,
      epoch: null,
      inferred: true
    };
  }

  const str = String(rawTime).trim();
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return {
      formatted: d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      iso: d.toISOString(),
      epoch: parsed,
      inferred: false
    };
  }

  return {
    formatted: str,
    iso: null,
    epoch: null,
    inferred: false
  };
}

function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseMessyData(rawInput: unknown, aqiStandard: AqiStandard = 'cpcb'): ParsedDataSet {
  let rows: Record<string, unknown>[] = [];
  let formatDetected = 'csv';

  if (!rawInput || (typeof rawInput === 'string' && rawInput.trim().length === 0)) {
    return {
      success: false,
      error: 'Empty data input provided. Please paste or upload air quality data.',
      formatDetected: 'unknown',
      totalRecords: 0,
      completenessPercent: 0,
      standard: aqiStandard,
      headerMap: {},
      summary: {
        averageAQI: 0,
        peakAQI: 0,
        category: 'Insufficient Data',
        badgeColor: 'bg-slate-700 text-slate-100',
        dominantPollutant: 'None',
        peakLocation: 'N/A',
        peakTimestamp: 'N/A',
        peakRowIndex: null,
        hotspotCount: 0,
        totalStations: 0
      },
      records: [],
      stations: [],
      anomalies: [],
      dataGaps: []
    };
  }

  if (typeof rawInput === 'object' && Array.isArray(rawInput)) {
    rows = rawInput as Record<string, unknown>[];
    formatDetected = 'json';
  } else if (typeof rawInput === 'string' && (rawInput.trim().startsWith('[') || rawInput.trim().startsWith('{'))) {
    try {
      const parsed = JSON.parse(rawInput.trim());
      rows = (Array.isArray(parsed) ? parsed : (parsed.data || parsed.readings || parsed.results || [parsed])) as Record<string, unknown>[];
      formatDetected = 'json';
    } catch {
      // Fall through to tabular parsing
    }
  }

  if (formatDetected !== 'json') {
    const text = String(rawInput).trim();
    const delimiter = detectDelimiter(text);
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length < 2) {
      return {
        success: false,
        error: 'Data requires at least a header row and one reading row.',
        formatDetected,
        totalRecords: 0,
        completenessPercent: 0,
        standard: aqiStandard,
        headerMap: {},
        summary: {
          averageAQI: 0,
          peakAQI: 0,
          category: 'Insufficient Data',
          badgeColor: 'bg-slate-700 text-slate-100',
          dominantPollutant: 'None',
          peakLocation: 'N/A',
          peakTimestamp: 'N/A',
          peakRowIndex: null,
          hotspotCount: 0,
          totalStations: 0
        },
        records: [],
        stations: [],
        anomalies: [],
        dataGaps: []
      };
    }

    const headers = splitLine(lines[0], delimiter);
    for (let i = 1; i < lines.length; i++) {
      const values = splitLine(lines[i], delimiter);
      const rowObj: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] !== undefined ? values[idx] : null;
      });
      rows.push(rowObj);
    }
  }

  if (rows.length === 0) {
    return {
      success: false,
      error: 'No valid data rows found in the input.',
      formatDetected,
      totalRecords: 0,
      completenessPercent: 0,
      standard: aqiStandard,
      headerMap: {},
      summary: {
        averageAQI: 0,
        peakAQI: 0,
        category: 'Insufficient Data',
        badgeColor: 'bg-slate-700 text-slate-100',
        dominantPollutant: 'None',
        peakLocation: 'N/A',
        peakTimestamp: 'N/A',
        peakRowIndex: null,
        hotspotCount: 0,
        totalStations: 0
      },
      records: [],
      stations: [],
      anomalies: [],
      dataGaps: []
    };
  }

  const sampleRow = rows[0];
  const headerMap: Record<string, string> = {};
  for (const rawHeader of Object.keys(sampleRow)) {
    const canon = matchCanonicalKey(rawHeader);
    if (canon && !headerMap[canon]) {
      headerMap[canon] = rawHeader;
    }
  }

  const hasStation = !!headerMap.station;
  const hasTimestamp = !!headerMap.timestamp;

  const processedRecords: AirQualityRecord[] = [];
  const anomalies: DataAnomaly[] = [];
  const stationMap = new Map<string, AirQualityRecord[]>();
  const consecutiveValues: Record<string, { val: number; count: number }> = {};

  rows.forEach((row, rowIndex) => {
    const originalRowIndex = rowIndex + 1;
    const stationName = hasStation && row[headerMap.station]
      ? String(row[headerMap.station]).trim()
      : 'Ward Monitoring Station';

    const timeInfo = hasTimestamp
      ? standardizeTimestamp(row[headerMap.timestamp], rowIndex)
      : standardizeTimestamp(null, rowIndex);

    const pollutants: PollutantValues = {};
    const rowIssues: ReadingIssue[] = [];

    ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'aqi', 'temperature', 'humidity', 'wind_speed'].forEach(key => {
      const rawHeader = headerMap[key];
      if (rawHeader && row[rawHeader] !== undefined) {
        const { value, isMissing } = extractNumericAndUnit(row[rawHeader], rawHeader);

        if (isMissing) {
          rowIssues.push({
            type: 'missing_reading',
            parameter: key.toUpperCase(),
            message: `Missing reading for ${key.toUpperCase()}`
          });
        } else if (value !== null && value < 0) {
          rowIssues.push({
            type: 'negative_drift',
            parameter: key.toUpperCase(),
            message: `Unreliable negative reading (${value}) flagged and set to zero baseline.`
          });
          anomalies.push({
            rowIndex: originalRowIndex,
            station: stationName,
            timestamp: timeInfo.formatted,
            parameter: key.toUpperCase(),
            type: 'Negative Value (Sensor Baseline Drift)',
            detail: `Value was ${value}; corrected for reporting. Check sensor optical calibration.`,
            severity: 'warning'
          });
          pollutants[key] = 0;
        } else if (value !== null) {
          if (key === 'pm25' && value > 1000) {
            anomalies.push({
              rowIndex: originalRowIndex,
              station: stationName,
              timestamp: timeInfo.formatted,
              parameter: 'PM2.5',
              type: 'Extreme Outlier Spike',
              detail: `PM2.5 spike to ${value} µg/m³. Verify if due to direct plume or optical chamber dust clogging.`,
              severity: 'alert'
            });
          }

          const freezeKey = `${stationName}_${key}`;
          if (consecutiveValues[freezeKey] && consecutiveValues[freezeKey].val === value && value > 0) {
            consecutiveValues[freezeKey].count++;
            if (consecutiveValues[freezeKey].count === 4) {
              anomalies.push({
                rowIndex: originalRowIndex,
                station: stationName,
                timestamp: timeInfo.formatted,
                parameter: key.toUpperCase(),
                type: 'Sensor Freeze / Flatline',
                detail: `Sensor reported static value (${value}) for 4+ consecutive readings. Likely telemetry or hardware lockup.`,
                severity: 'alert'
              });
            }
          } else {
            consecutiveValues[freezeKey] = { val: value, count: 1 };
          }

          pollutants[key] = value;
        }
      }
    });

    const aqiResult = calculateOverallAQI(pollutants, aqiStandard);

    const record: AirQualityRecord = {
      rowIndex: originalRowIndex,
      station: stationName,
      timestamp: timeInfo.formatted,
      isoTimestamp: timeInfo.iso,
      epoch: timeInfo.epoch,
      pollutants,
      aqi: aqiResult.aqi,
      dominantPollutant: aqiResult.dominantPollutant,
      category: aqiResult.category,
      level: aqiResult.level,
      badgeColor: aqiResult.badgeColor,
      bgColor: aqiResult.bgColor,
      textColor: aqiResult.textColor,
      issues: rowIssues,
      raw: row
    };

    processedRecords.push(record);

    if (!stationMap.has(stationName)) {
      stationMap.set(stationName, []);
    }
    stationMap.get(stationName)!.push(record);
  });

  const dataGaps: DataGap[] = [];
  Array.from(stationMap.entries()).forEach(([stName, stRecords]) => {
    const validEpochs = stRecords.filter((r: AirQualityRecord) => r.epoch !== null).sort((a: AirQualityRecord, b: AirQualityRecord) => a.epoch! - b.epoch!);
    if (validEpochs.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < Math.min(validEpochs.length, 10); i++) {
        intervals.push(validEpochs[i].epoch! - validEpochs[i - 1].epoch!);
      }
      const medianInterval = intervals.sort((a: number, b: number) => a - b)[Math.floor(intervals.length / 2)] || 3600000;

      for (let i = 1; i < validEpochs.length; i++) {
        const gapMs = validEpochs[i].epoch! - validEpochs[i - 1].epoch!;
        if (gapMs > Math.max(medianInterval * 2.5, 2 * 3600000)) {
          const hours = (gapMs / 3600000).toFixed(1);
          dataGaps.push({
            station: stName,
            startTime: validEpochs[i - 1].timestamp,
            endTime: validEpochs[i].timestamp,
            gapHours: hours,
            detail: `Telemetry dropped for ${hours} hours between ${validEpochs[i - 1].timestamp} and ${validEpochs[i].timestamp}.`
          });
        }
      }
    }
  });

  const stationsList: StationSummary[] = [];
  let overallMaxAQI = 0;
  let overallSumAQI = 0;
  let validAQICount = 0;
  let highestRecord: AirQualityRecord | null = null;

  for (const [stName, stRecords] of Array.from(stationMap.entries())) {
    const validAQIs: number[] = stRecords
      .map((r: AirQualityRecord) => r.aqi)
      .filter((a: number | null | undefined): a is number => a !== null && a !== undefined && !isNaN(a) && a > 0);
    const avgAqi = validAQIs.length > 0 ? Math.round(validAQIs.reduce((a: number, b: number) => a + b, 0) / validAQIs.length) : 0;
    const maxAqi = validAQIs.length > 0 ? Math.max(...validAQIs) : 0;

    const pm25Vals = stRecords.map((r: AirQualityRecord) => r.pollutants.pm25).filter((v: number | null | undefined): v is number => v !== undefined && v !== null);
    const avgPM25 = pm25Vals.length > 0 ? +(pm25Vals.reduce((a: number, b: number) => a + b, 0) / pm25Vals.length).toFixed(1) : null;
    const maxPM25 = pm25Vals.length > 0 ? Math.max(...pm25Vals) : null;

    const peakRecord = stRecords.find((r: AirQualityRecord) => r.aqi === maxAqi) || null;

    if (maxAqi > overallMaxAQI) {
      overallMaxAQI = maxAqi;
      highestRecord = peakRecord;
    }

    validAQIs.forEach((a: number) => {
      overallSumAQI += a;
      validAQICount++;
    });

    const categoryMeta = calculateOverallAQI({ aqi: avgAqi }, aqiStandard);

    stationsList.push({
      station: stName,
      readingCount: stRecords.length,
      averageAQI: avgAqi,
      peakAQI: maxAqi,
      peakTime: peakRecord ? peakRecord.timestamp : 'N/A',
      peakRow: peakRecord ? peakRecord.rowIndex : null,
      averagePM25: avgPM25,
      peakPM25: maxPM25,
      category: categoryMeta.category,
      badgeColor: categoryMeta.badgeColor,
      isHotspot: avgAqi >= 201 || maxAqi >= 300,
      records: stRecords
    });
  }

  stationsList.sort((a, b) => b.averageAQI - a.averageAQI);

  const totalExpectedCells = processedRecords.length * Math.max(Object.keys(headerMap).length, 1);
  const totalMissing = processedRecords.reduce((acc, r) => acc + r.issues.filter(i => i.type === 'missing_reading').length, 0);
  const completenessPercent = totalExpectedCells > 0
    ? Math.max(0, Math.min(100, Math.round(((totalExpectedCells - totalMissing) / totalExpectedCells) * 100)))
    : 100;

  const averageAQI = validAQICount > 0 ? Math.round(overallSumAQI / validAQICount) : 0;
  const overallMeta = calculateOverallAQI({ aqi: averageAQI }, aqiStandard);

  return {
    success: true,
    formatDetected,
    totalRecords: processedRecords.length,
    completenessPercent,
    standard: aqiStandard,
    headerMap,
    summary: {
      averageAQI,
      peakAQI: overallMaxAQI,
      category: overallMeta.category,
      badgeColor: overallMeta.badgeColor,
      dominantPollutant: highestRecord ? highestRecord.dominantPollutant : 'PM2.5',
      peakLocation: highestRecord ? highestRecord.station : 'N/A',
      peakTimestamp: highestRecord ? highestRecord.timestamp : 'N/A',
      peakRowIndex: highestRecord ? highestRecord.rowIndex : null,
      hotspotCount: stationsList.filter(s => s.isHotspot).length,
      totalStations: stationsList.length
    },
    stations: stationsList,
    records: processedRecords,
    anomalies,
    dataGaps
  };
}
