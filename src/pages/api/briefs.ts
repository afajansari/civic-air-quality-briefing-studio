import type { NextApiRequest, NextApiResponse } from 'next';
import { getSavedBriefs, saveBrief } from '@/lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const briefs = getSavedBriefs();
    return res.status(200).json({
      success: true,
      briefs: briefs.map((b) => ({
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

  if (req.method === 'POST') {
    try {
      const brief = req.body;
      saveBrief(brief);
      return res.status(200).json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save brief';
      return res.status(400).json({ success: false, error: message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
}
