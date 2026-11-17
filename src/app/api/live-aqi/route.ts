import { NextRequest, NextResponse } from 'next/server';
import { findCityCoordinates, formatOpenMeteoCsv } from '@/lib/india-cities';

export const dynamic = 'force-dynamic';

interface OpenMeteoCurrent {
  time?: string;
  pm10?: number | null;
  pm2_5?: number | null;
  carbon_monoxide?: number | null;
  nitrogen_dioxide?: number | null;
  sulphur_dioxide?: number | null;
  ozone?: number | null;
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
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCity = searchParams.get('city');
    const rawLat = searchParams.get('lat');
    const rawLon = searchParams.get('lon');

    let cityName = 'Delhi';
    let stationName = 'Delhi CPCB CAAQMS Grid';
    let lat: number = 28.6139;
    let lon: number = 77.2090;

    // 1. Resolve coordinates from lat/lon or city query
    if (rawLat && rawLon) {
      const parsedLat = parseFloat(rawLat);
      const parsedLon = parseFloat(rawLon);

      if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
        return NextResponse.json(
          { success: false, error: 'Invalid latitude or longitude parameters.' },
          { status: 400 }
        );
      }

      lat = parsedLat;
      lon = parsedLon;
      cityName = rawCity ? rawCity.trim().slice(0, 50) : `Coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
      stationName = `${cityName} CAAQMS Station`;
    } else {
      const queryCity = (rawCity || 'Delhi').trim();

      // Guard against abnormal length or malicious input
      if (queryCity.length > 80 || !/^[a-zA-Z0-9\s,.\-()]+$/.test(queryCity)) {
        return NextResponse.json(
          { success: false, error: 'Invalid city name. Please provide valid text characters.' },
          { status: 400 }
        );
      }

      cityName = queryCity;

      // Look up in predefined high-accuracy Indian monitoring grid
      const preset = findCityCoordinates(queryCity);
      if (preset) {
        lat = preset.lat;
        lon = preset.lon;
        cityName = preset.city;
        stationName = preset.station || `${preset.name} CAAQMS`;
      } else {
        // Query Open-Meteo Geocoding API for any Indian city/town/ward
        const geoController = new AbortController();
        const geoTimeout = setTimeout(() => geoController.abort(), 6000);

        try {
          const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryCity)}&country=India&count=1&language=en&format=json`;
          const geoRes = await fetch(geoUrl, {
            signal: geoController.signal,
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
          });

          clearTimeout(geoTimeout);

          if (!geoRes.ok) {
            return NextResponse.json(
              { success: false, error: `Upstream geocoding service returned status ${geoRes.status}.` },
              { status: 502 }
            );
          }

          const geoData: GeocodingResponse = await geoRes.json();
          if (!geoData.results || geoData.results.length === 0) {
            return NextResponse.json(
              {
                success: false,
                error: `Could not resolve coordinates for "${queryCity}" within India. Please check the spelling or choose a preset city.`
              },
              { status: 404 }
            );
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
          return NextResponse.json(
            {
              success: false,
              error: isAbort
                ? 'Geocoding request timed out. Please try again.'
                : 'Unable to reach geocoding service.'
            },
            { status: 502 }
          );
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
      next: { revalidate: 60 }
    });

    clearTimeout(aqiTimeout);

    if (!aqiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Open-Meteo Air Quality API returned HTTP ${aqiRes.status}. Telemetry for this location is currently unavailable.`
        },
        { status: 502 }
      );
    }

    const aqiData: OpenMeteoAirQualityResponse = await aqiRes.json();

    if (aqiData.error) {
      return NextResponse.json(
        { success: false, error: aqiData.reason || 'Open-Meteo returned an error payload.' },
        { status: 502 }
      );
    }

    const current = aqiData.current || {};

    // Standardize current criteria pollutant readings
    // Note: CO is reported in µg/m³ by Open-Meteo, convert to mg/m³ for CPCB/EPA standard compliance
    const currentPM25 = typeof current.pm2_5 === 'number' ? +(current.pm2_5.toFixed(1)) : null;
    const currentPM10 = typeof current.pm10 === 'number' ? +(current.pm10.toFixed(1)) : null;
    const currentNO2 = typeof current.nitrogen_dioxide === 'number' ? +(current.nitrogen_dioxide.toFixed(1)) : null;
    const currentSO2 = typeof current.sulphur_dioxide === 'number' ? +(current.sulphur_dioxide.toFixed(1)) : null;
    const currentCO = typeof current.carbon_monoxide === 'number' ? +(current.carbon_monoxide / 1000).toFixed(2) : null;
    const currentO3 = typeof current.ozone === 'number' ? +(current.ozone.toFixed(1)) : null;
    const currentTime = current.time ? current.time.replace('T', ' ') : new Date().toISOString().slice(0, 16).replace('T', ' ');

    // 3. Format clean CSV string compatible with studio parser
    // Header: Station,Timestamp,PM2.5,PM10,NO2,SO2,CO,O3
    const csvData = formatOpenMeteoCsv(stationName, aqiData);

    return NextResponse.json({
      success: true,
      city: cityName,
      station: stationName,
      coordinates: {
        lat,
        lon
      },
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
    return NextResponse.json(
      {
        success: false,
        error: isAbort ? 'Open-Meteo Air Quality telemetry connection timed out.' : `Error retrieving live AQI: ${message}`
      },
      { status: 502 }
    );
  }
}
