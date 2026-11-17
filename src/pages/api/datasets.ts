import type { NextApiRequest, NextApiResponse } from 'next';
import { INDIAN_DATASETS } from '@/lib/authentic-datasets';
import { INDIAN_CITIES, REGIONAL_CHIPS } from '@/lib/india-cities';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  return res.status(200).json({
    success: true,
    datasets: INDIAN_DATASETS,
    cities: INDIAN_CITIES,
    regionalChips: REGIONAL_CHIPS
  });
}
