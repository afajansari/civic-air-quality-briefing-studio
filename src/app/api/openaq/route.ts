import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface OpenAQMeasurement {
  parameter?: string;
  value?: number;
  lastUpdated?: string;
}

interface OpenAQResult {
  location?: string;
  entity?: string;
  measurements?: OpenAQMeasurement[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawCity = searchParams.get('city') || 'Delhi';

  // Security check: Guard against SSRF & header injection
  const trimmed = rawCity.trim();
  if (trimmed.length > 50 || !/^[a-zA-Z0-9\s\-]+$/.test(trimmed)) {
    return NextResponse.json(
      { success: false, error: 'Invalid city parameter. Only alphanumeric characters, hyphens, and spaces allowed.' },
      { status: 400 }
    );
  }

  const city = encodeURIComponent(trimmed);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const url = `https://api.openaq.org/v2/latest?city=${city}&limit=25`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      },
      next: { revalidate: 60 }
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const rows = ['Station,Timestamp,PM2.5,PM10,NO2,SO2,O3,CO'];
        (data.results as OpenAQResult[]).forEach((r) => {
          const st = String(r.location || r.entity || 'Station').replace(/[,;]/g, ' ');
          const pms: Record<string, number | string> = {};
          let time = new Date().toISOString().slice(0, 16).replace('T', ' ');

          (r.measurements || []).forEach((m) => {
            if (m.lastUpdated) time = m.lastUpdated.slice(0, 16).replace('T', ' ');
            const param = String(m.parameter || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (param === 'pm25' && m.value !== undefined) pms.pm25 = m.value;
            else if (param === 'pm10' && m.value !== undefined) pms.pm10 = m.value;
            else if (param === 'no2' && m.value !== undefined) pms.no2 = m.value;
            else if (param === 'so2' && m.value !== undefined) pms.so2 = m.value;
            else if (param === 'o3' && m.value !== undefined) pms.o3 = m.value;
            else if (param === 'co' && m.value !== undefined) pms.co = m.value;
          });

          rows.push(`${st},${time},${pms.pm25 ?? ''},${pms.pm10 ?? ''},${pms.no2 ?? ''},${pms.so2 ?? ''},${pms.o3 ?? ''},${pms.co ?? ''}`);
        });

        return NextResponse.json({
          success: true,
          city: trimmed,
          source: 'OpenAQ Real-Time Global Air Monitoring Network',
          csvData: rows.join('\n')
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: `Live telemetry for "${trimmed}" is currently unavailable or rate-limited by upstream API. You can select one of our curated authentic datasets or paste direct sensor logs.`
    }, { status: 404 });
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const message = err instanceof Error ? err.message : 'Unknown network error';
    return NextResponse.json({
      success: false,
      error: isAbort ? 'Upstream OpenAQ API timed out.' : `Network error connecting to OpenAQ: ${message}`
    }, { status: 502 });
  }
}
