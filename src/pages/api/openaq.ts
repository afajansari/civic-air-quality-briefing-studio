import type { NextApiRequest, NextApiResponse } from 'next';
import liveAqiHandler from './live-aqi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return liveAqiHandler(req, res);
}
