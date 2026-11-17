import { NextResponse } from 'next/server';
import { INDIAN_DATASETS } from '@/lib/authentic-datasets';
import { INDIAN_CITIES, REGIONAL_CHIPS } from '@/lib/india-cities';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    datasets: INDIAN_DATASETS,
    cities: INDIAN_CITIES,
    regionalChips: REGIONAL_CHIPS
  });
}
