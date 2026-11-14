import { NextRequest, NextResponse } from 'next/server';
import { compareBriefs } from '@/lib/brief-comparator';
import { getBriefById, getLatestBrief } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentBrief, previousBriefId } = body;

    if (!currentBrief) {
      return NextResponse.json(
        { success: false, error: 'Current brief is required' },
        { status: 400 }
      );
    }

    const previousBrief = previousBriefId
      ? getBriefById(previousBriefId)
      : getLatestBrief();

    const comparison = compareBriefs(currentBrief, previousBrief);

    return NextResponse.json({
      success: true,
      comparison
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Comparison failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
