import { NextResponse } from 'next/server';
import { AUTHENTIC_DATASETS } from '@/lib/authentic-datasets';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    datasets: AUTHENTIC_DATASETS
  });
}
