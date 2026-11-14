import { NextRequest, NextResponse } from 'next/server';
import { getSavedBriefs, saveBrief } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const briefs = getSavedBriefs();
  return NextResponse.json({
    success: true,
    briefs: briefs.map(b => ({
      id: b.id,
      generatedAt: b.generatedAt,
      persona: b.persona,
      personaTitle: b.personaTitle,
      averageAQI: b.summary.averageAQI,
      category: b.summary.category,
      badgeColor: b.summary.badgeColor,
      dominantPollutant: b.summary.dominantPollutant,
      peakLocation: b.summary.peakLocation,
      peakAQI: b.summary.peakAQI
    }))
  });
}

export async function POST(req: NextRequest) {
  try {
    const brief = await req.json();
    saveBrief(brief);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save brief';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
