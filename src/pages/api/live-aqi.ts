import type { NextApiRequest, NextApiResponse } from 'next';
import { findCityCoordinates } from '@/lib/india-cities';

interface OpenMeteoCurrent {
  time?: string;
  pm10?: number;
  pm2_5?: number;
  carbon_monoxide?: number;
  nitrogen_dioxide?: number;
  sulphur_dioxide?: number;
  ozone?: number;
}

interface OpenMeteoHourly {
  time?: string[];
  pm10?: (number | null)[];
  pm2_5?: (number | null)[];
  carbon_monoxide?: (number | null)[];
  nitrogen_dioxide?: (number | null)[];
  sulphur_dioxide?: (number | null)[];
  ozone?: (number | null)[];
}

interface OpenMeteoAirQualityResponse {
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
  error?: boolean;
  reason?: string;
}

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    const rawCity = typeof req.query.city === 'string' ? req.query.city : undefined;
    const rawLat = typeof req.query.lat === 'string' ? req.query.lat : undefined;
    const rawLon = typeof req.query.lon === 'string' ? req.query.lon : undefined;

    let cityName = 'Delhi';
    let stationName = 'Delhi CPCB CAAQMS Grid';
    let lat: number = 28.6139;
    let lon: number = 77.2090;

    // 1. Resolve coordinates from lat/lon or city query
    if (rawLat && rawLon) {
      const parsedLat = parseFloat(rawLat);
      const parsedLon = parseFloat(rawLon);

      if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
        return res.status(400).json({ success: false, error: 'Invalid latitude or longitude parameters.' });
      }

      lat = parsedLat;
      lon = parsedLon;
      cityName = rawCity ? rawCity.trim().slice(0, 50) : `Coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
      stationName = `${cityName} CAAQMS Station`;
    } else {
      const queryCity = (rawCity || 'Delhi').trim();

      if (queryCity.length > 80 || !/^[a-zA-Z0-9\s,.\-()]+$/.test(queryCity)) {
        return res.status(400).json({ success: false, error: 'Invalid city name. Please provide valid text characters.' });
      }

      cityName = queryCity;

      const preset = findCityCoordinates(queryCity);
      if (preset) {
        lat = preset.lat;
        lon = preset.lon;
        cityName = preset.city;
        stationName = preset.station || `${preset.name} CAAQMS`;
      } else {
        const geoController = new AbortController();
        const geoTimeout = setTimeout(() => geoController.abort(), 6000);

        try {
          const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryCity)}&country=India&count=1&language=en&format=json`;
          const geoRes = await fetch(geoUrl, {
            signal: geoController.signal,
            headers: { 'Accept': 'application/json' },
            // 24-hour geocoding caching
            next: { revalidate: 86400 }
          } as RequestInit);

          clearTimeout(geoTimeout);

          if (!geoRes.ok) {
            return res.status(502).json({ success: false, error: `Upstream geocoding service returned status ${geoRes.status}.` });
          }

          const geoData: GeocodingResponse = await geoRes.json();
          if (!geoData.results || geoData.results.length === 0) {
            return res.status(404).json({
              success: false,
              error: `Could not resolve coordinates for "${queryCity}" within India. Please check the spelling or choose a preset city.`
            });
          }

          const first = geoData.results[0];
          lat = first.latitude;
          lon = first.longitude;
          cityName = first.name;
          const state = first.admin1 ? `, ${first.admin1}` : '';
          stationName = `${first.name}${state} Ambient Grid`;
        } catch (geoErr: unknown) {
          clearTimeout(geoTimeout);
          const isAbort = geoErr instanceof Error && geoErr.name === 'AbortError';
          return res.status(502).json({
            success: false,
            error: isAbort ? 'Geocoding request timed out. Please try again.' : 'Unable to reach geocoding service.'
          });
        }
      }
    }

    // 2. Fetch real-time and hourly telemetry from Open-Meteo Air Quality API
    const aqiController = new AbortController();
    const aqiTimeout = setTimeout(() => aqiController.abort(), 8000);

    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=Asia%2FKolkata`;

    const aqiRes = await fetch(aqiUrl, {
      signal: aqiController.signal,
      headers: { 'Accept': 'application/json' },
      // 15-minute ISR revalidation for air quality fetch
      next: { revalidate: 900 }
    } as RequestInit);

    clearTimeout(aqiTimeout);

    if (!aqiRes.ok) {
      return res.status(502).json({
        success: false,
        error: `Open-Meteo Air Quality API returned HTTP ${aqiRes.status}. Telemetry for this location is currently unavailable.`
      });
    }

    const aqiData: OpenMeteoAirQualityResponse = await aqiRes.json();

    if (aqiData.error) {
      return res.status(502).json({ success: false, error: aqiData.reason || 'Open-Meteo returned an error payload.' });
    }

    const current = aqiData.current || {};

    const currentPM25 = typeof current.pm2_5 === 'number' ? +(current.pm2_5.toFixed(1)) : null;
    const currentPM10 = typeof current.pm10 === 'number' ? +(current.pm10.toFixed(1)) : null;
    const currentNO2 = typeof current.nitrogen_dioxide === 'number' ? +(current.nitrogen_dioxide.toFixed(1)) : null;
    const currentSO2 = typeof current.sulphur_dioxide === 'number' ? +(current.sulphur_dioxide.toFixed(1)) : null;
    const currentCO = typeof current.carbon_monoxide === 'number' ? +(current.carbon_monoxide / 1000).toFixed(2) : null;
    const currentO3 = typeof current.ozone === 'number' ? +(current.ozone.toFixed(1)) : null;
    const currentTime = current.time ? current.time.replace('T', ' ') : new Date().toISOString().slice(0, 16).replace('T', ' ');

    const csvData = formatOpenMeteoCsv(stationName, aqiData);

    // 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800'
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({
      success: true,
      city: cityName,
      station: stationName,
      coordinates: { lat, lon },
      current: {
        pm25: currentPM25,
        pm10: currentPM10,
        no2: currentNO2,
        so2: currentSO2,
        co: currentCO,
        o3: currentO3,
        time: currentTime
      },
      csvData
    });
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const message = err instanceof Error ? err.message : 'Unknown network failure';
    return res.status(502).json({
      success: false,
      error: isAbort ? 'Open-Meteo Air Quality telemetry connection timed out.' : `Error retrieving live AQI: ${message}`
    });
  }
}

function formatOpenMeteoCsv(stationName: string, aqiData: OpenMeteoAirQualityResponse): string {
  const safeStation = stationName.replace(/[,"]/g, ' ').trim();
  const rows: string[] = ['Station,Timestamp,PM2.5,PM10,NO2,SO2,CO,O3'];

  const hourly = aqiData.hourly;
  if (!hourly || !hourly.time || !Array.isArray(hourly.time) || hourly.time.length === 0) {
    const current = aqiData.current || {};
    const t = current.time ? current.time.replace('T', ' ') : new Date().toISOString().slice(0, 16).replace('T', ' ');
    const p25 = current.pm2_5 != null ? current.pm2_5.toFixed(1) : '';
    const p10 = current.pm10 != null ? current.pm10.toFixed(1) : '';
    const no2 = current.nitrogen_dioxide != null ? current.nitrogen_dioxide.toFixed(1) : '';
    const so2 = current.sulphur_dioxide != null ? current.sulphur_dioxide.toFixed(1) : '';
    const co = current.carbon_monoxide != null ? (current.carbon_monoxide / 1000).toFixed(2) : '';
    const o3 = current.ozone != null ? current.ozone.toFixed(1) : '';
    rows.push(`${safeStation},${t},${p25},${p10},${no2},${so2},${co},${o3}`);
    return rows.join('\n');
  }

  const times = hourly.time;
  const pm25Arr = hourly.pm2_5 || [];
  const pm10Arr = hourly.pm10 || [];
  const no2Arr = hourly.nitrogen_dioxide || [];
  const so2Arr = hourly.sulphur_dioxide || [];
  const coArr = hourly.carbon_monoxide || [];
  const o3Arr = hourly.ozone || [];

  const maxPoints = Math.min(times.length, 72);
  const startIndex = Math.max(0, times.length - maxPoints);

  for (let i = startIndex; i < times.length; i++) {
    const rawT = times[i];
    const t = rawT ? rawT.replace('T', ' ') : '';
    const p25 = typeof pm25Arr[i] === 'number' && !isNaN(pm25Arr[i]!) ? pm25Arr[i]!.toFixed(1) : '';
    const p10 = typeof pm10Arr[i] === 'number' && !isNaN(pm10Arr[i]!) ? pm10Arr[i]!.toFixed(1) : '';
    const no2 = typeof no2Arr[i] === 'number' && !isNaN(no2Arr[i]!) ? no2Arr[i]!.toFixed(1) : '';
    const so2 = typeof so2Arr[i] === 'number' && !isNaN(so2Arr[i]!) ? so2Arr[i]!.toFixed(1) : '';
    const co = typeof coArr[i] === 'number' && !isNaN(coArr[i]!) ? (coArr[i]! / 1000).toFixed(2) : '';
    const o3 = typeof o3Arr[i] === 'number' && !isNaN(o3Arr[i]!) ? o3Arr[i]!.toFixed(1) : '';

    rows.push(`${safeStation},${t},${p25},${p10},${no2},${so2},${co},${o3}`);
  }

  return rows.join('\n');
}
