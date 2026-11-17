import { NextRequest } from 'next/server';
import { GET as liveAqiGet } from '../live-aqi/route';

export const dynamic = 'force-dynamic';

/**
 * Legacy OpenAQ route adapter.
 * OpenAQ v2 endpoints are deprecated/rate-limited upstream; this handler
 * seamlessly proxies requests to the live Open-Meteo & Indian CAAQMS telemetry service.
 */
export async function GET(req: NextRequest) {
  return liveAqiGet(req);
}
