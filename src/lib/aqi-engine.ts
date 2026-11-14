/**
 * Civic Air Quality Briefing Studio - AQI Calculation Engine
 * Supports US EPA AQI and Indian NAQI (CPCB) standards
 * with exact breakpoint interpolation and accessibility metadata.
 */

import { AqiStandard, PollutantValues } from '../types';

export const EPA_BREAKPOINTS: Record<string, [number, number, number, number][]> = {
  pm25: [
    [0.0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500]
  ],
  pm10: [
    [0, 54, 0, 50],
    [55, 154, 51, 100],
    [155, 254, 101, 150],
    [255, 354, 151, 200],
    [355, 424, 201, 300],
    [425, 504, 301, 400],
    [505, 604, 401, 500]
  ],
  no2: [
    [0, 53, 0, 50],
    [54, 100, 51, 100],
    [101, 360, 101, 150],
    [361, 649, 151, 200],
    [650, 1249, 201, 300],
    [1250, 1649, 301, 400],
    [1650, 2049, 401, 500]
  ],
  co: [
    [0.0, 4.4, 0, 50],
    [4.5, 9.4, 51, 100],
    [9.5, 12.4, 101, 150],
    [12.5, 15.4, 151, 200],
    [15.5, 30.4, 201, 300],
    [30.5, 40.4, 301, 400],
    [40.5, 50.4, 401, 500]
  ],
  so2: [
    [0, 35, 0, 50],
    [36, 75, 51, 100],
    [76, 185, 101, 150],
    [186, 304, 151, 200],
    [305, 604, 201, 300],
    [605, 804, 301, 400],
    [805, 1004, 401, 500]
  ],
  o3: [
    [0, 54, 0, 50],
    [55, 70, 51, 100],
    [71, 85, 101, 150],
    [86, 105, 151, 200],
    [106, 200, 201, 300]
  ]
};

export const CPCB_BREAKPOINTS: Record<string, [number, number, number, number][]> = {
  pm25: [
    [0, 30, 0, 50],
    [31, 60, 51, 100],
    [61, 90, 101, 200],
    [91, 120, 201, 300],
    [121, 250, 301, 400],
    [251, 500, 401, 500]
  ],
  pm10: [
    [0, 50, 0, 50],
    [51, 100, 51, 100],
    [101, 250, 101, 200],
    [251, 350, 201, 300],
    [351, 430, 301, 400],
    [431, 600, 401, 500]
  ],
  no2: [
    [0, 40, 0, 50],
    [41, 80, 51, 100],
    [81, 180, 101, 200],
    [181, 280, 201, 300],
    [281, 400, 301, 400],
    [401, 600, 401, 500]
  ],
  so2: [
    [0, 40, 0, 50],
    [41, 80, 51, 100],
    [81, 380, 101, 200],
    [381, 800, 201, 300],
    [801, 1600, 301, 400],
    [1601, 2000, 401, 500]
  ],
  co: [
    [0, 1.0, 0, 50],
    [1.1, 2.0, 51, 100],
    [2.1, 10.0, 101, 200],
    [10.1, 17.0, 201, 300],
    [17.1, 34.0, 301, 400],
    [34.1, 50.0, 401, 500]
  ],
  o3: [
    [0, 50, 0, 50],
    [51, 100, 51, 100],
    [101, 168, 101, 200],
    [169, 208, 201, 300],
    [209, 748, 301, 400],
    [749, 1000, 401, 500]
  ]
};

export function calculateSubIndex(
  conc: number | null | undefined,
  breakpoints: [number, number, number, number][]
): number | null {
  if (conc === null || conc === undefined || isNaN(conc) || conc < 0) return null;

  for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
    if (conc >= cLow && conc <= cHigh) {
      const aqi = ((iHigh - iLow) / (cHigh - cLow)) * (conc - cLow) + iLow;
      return Math.round(aqi);
    }
  }

  // Beyond upper limit
  if (conc > breakpoints[breakpoints.length - 1][1]) {
    const last = breakpoints[breakpoints.length - 1];
    const prev = breakpoints[breakpoints.length - 2];
    const slope = (last[3] - prev[3]) / (last[1] - prev[1]);
    const aqi = last[3] + slope * (conc - last[1]);
    return Math.min(Math.round(aqi), 999);
  }

  return null;
}

export function getAQICategory(aqi: number | null | undefined, standard: AqiStandard = 'cpcb') {
  if (aqi === null || aqi === undefined || isNaN(aqi)) {
    return {
      category: 'Insufficient Data',
      level: 'unknown',
      bgColor: '#64748b',
      textColor: '#ffffff',
      badgeColor: 'bg-slate-700 text-slate-100 border-slate-600',
      description: 'Sensor data insufficient to compute AQI reliably',
      severity: 0
    };
  }

  if (standard === 'epa') {
    if (aqi <= 50) {
      return {
        category: 'Good',
        level: 'good',
        bgColor: '#10b981',
        textColor: '#064e3b',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        description: 'Air quality is satisfactory, and poses little or no risk.',
        severity: 1
      };
    } else if (aqi <= 100) {
      return {
        category: 'Moderate',
        level: 'moderate',
        bgColor: '#eab308',
        textColor: '#713f12',
        badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
        description: 'Air quality is acceptable; very sensitive people may experience minor irritation.',
        severity: 2
      };
    } else if (aqi <= 150) {
      return {
        category: 'Unhealthy for Sensitive Groups',
        level: 'unhealthy-sensitive',
        bgColor: '#f97316',
        textColor: '#7c2d12',
        badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
        description: 'Sensitive groups (children, elderly, respiratory patients) may experience health effects.',
        severity: 3
      };
    } else if (aqi <= 200) {
      return {
        category: 'Unhealthy',
        level: 'unhealthy',
        bgColor: '#ef4444',
        textColor: '#7f1d1d',
        badgeColor: 'bg-red-100 text-red-900 border-red-300',
        description: 'Everyone may begin to experience health effects; sensitive groups may experience more serious effects.',
        severity: 4
      };
    } else if (aqi <= 300) {
      return {
        category: 'Very Unhealthy',
        level: 'very-unhealthy',
        bgColor: '#8b5cf6',
        textColor: '#4c1d95',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
        description: 'Health alert: The risk of health effects is increased for everyone.',
        severity: 5
      };
    } else {
      return {
        category: 'Hazardous',
        level: 'hazardous',
        bgColor: '#881337',
        textColor: '#ffe4e6',
        badgeColor: 'bg-rose-950 text-rose-100 border-rose-800',
        description: 'Emergency health warning: Entire population is more likely to be affected.',
        severity: 6
      };
    }
  } else {
    // Default: Indian NAQI (CPCB)
    if (aqi <= 50) {
      return {
        category: 'Good',
        level: 'good',
        bgColor: '#10b981',
        textColor: '#064e3b',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        description: 'Minimal impact on health.',
        severity: 1
      };
    } else if (aqi <= 100) {
      return {
        category: 'Satisfactory',
        level: 'satisfactory',
        bgColor: '#84cc16',
        textColor: '#365314',
        badgeColor: 'bg-lime-100 text-lime-900 border-lime-300',
        description: 'Minor breathing discomfort to sensitive people.',
        severity: 2
      };
    } else if (aqi <= 200) {
      return {
        category: 'Moderate',
        level: 'moderate',
        bgColor: '#eab308',
        textColor: '#713f12',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        description: 'Breathing discomfort to people with lung, heart disease, children and older adults.',
        severity: 3
      };
    } else if (aqi <= 300) {
      return {
        category: 'Poor',
        level: 'poor',
        bgColor: '#f97316',
        textColor: '#7c2d12',
        badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
        description: 'Breathing discomfort to most people on prolonged exposure.',
        severity: 4
      };
    } else if (aqi <= 400) {
      return {
        category: 'Very Poor',
        level: 'very-poor',
        bgColor: '#ef4444',
        textColor: '#7f1d1d',
        badgeColor: 'bg-red-100 text-red-900 border-red-300',
        description: 'Respiratory illness on prolonged exposure; significant impact on sensitive groups.',
        severity: 5
      };
    } else {
      return {
        category: 'Severe',
        level: 'severe',
        bgColor: '#701a75',
        textColor: '#fdf4ff',
        badgeColor: 'bg-fuchsia-950 text-fuchsia-100 border-fuchsia-800',
        description: 'Affects healthy people and seriously impacts those with existing diseases.',
        severity: 6
      };
    }
  }
}

export function calculateOverallAQI(pollutants: PollutantValues, standard: AqiStandard = 'cpcb') {
  const breakpoints = standard === 'epa' ? EPA_BREAKPOINTS : CPCB_BREAKPOINTS;
  const subIndices: Record<string, number> = {};
  let maxAQI = 0;
  let dominantPollutant = 'pm25';

  for (const [key, val] of Object.entries(pollutants)) {
    if (val === null || val === undefined) continue;
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    let matchedKey: string | null = null;

    if (cleanKey.includes('pm25') || cleanKey.includes('pm2')) matchedKey = 'pm25';
    else if (cleanKey.includes('pm10')) matchedKey = 'pm10';
    else if (cleanKey.includes('no2')) matchedKey = 'no2';
    else if (cleanKey.includes('so2')) matchedKey = 'so2';
    else if (cleanKey.includes('co')) matchedKey = 'co';
    else if (cleanKey.includes('o3') || cleanKey.includes('ozone')) matchedKey = 'o3';

    if (matchedKey && breakpoints[matchedKey]) {
      const subIdx = calculateSubIndex(val, breakpoints[matchedKey]);
      if (subIdx !== null) {
        subIndices[matchedKey] = subIdx;
        if (subIdx > maxAQI) {
          maxAQI = subIdx;
          dominantPollutant = matchedKey;
        }
      }
    }
  }

  if (pollutants.aqi !== undefined && pollutants.aqi !== null && !isNaN(pollutants.aqi)) {
    if (pollutants.aqi > maxAQI || Object.keys(subIndices).length === 0) {
      maxAQI = Math.round(Number(pollutants.aqi));
      dominantPollutant = 'aqi';
    }
  }

  const categoryMeta = getAQICategory(maxAQI, standard);

  return {
    aqi: maxAQI,
    dominantPollutant: dominantPollutant.toUpperCase(),
    subIndices,
    standard,
    ...categoryMeta
  };
}
