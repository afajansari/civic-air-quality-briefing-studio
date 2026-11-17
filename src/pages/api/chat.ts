import type { NextApiRequest, NextApiResponse } from 'next';
import { answerBriefQuestion } from '@/lib/gemini';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { brief, question, apiKey = null, stream = false } = req.body || {};

    if (!brief || !question || typeof question !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid brief object and question string are required' });
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      return res.status(400).json({ success: false, error: 'Question cannot be empty' });
    }

    if (trimmedQuestion.length > 1000) {
      return res.status(413).json({ success: false, error: 'Question exceeds maximum limit of 1,000 characters' });
    }

    let safeApiKey: string | null = null;
    if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0 && apiKey.length < 256) {
      safeApiKey = apiKey.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '');
    }

    const effectiveApiKey =
      safeApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPEN_ROUTER_API_KEY ||
      null;

    const wantsStream =
      Boolean(req.headers.accept?.includes('text/event-stream')) ||
      Boolean(stream === true);

    if (wantsStream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      });

      try {
        const answer = await answerBriefQuestion(brief, trimmedQuestion, effectiveApiKey);
        const words = answer.split(' ');
        for (let i = 0; i < words.length; i += 2) {
          const chunk = words.slice(i, i + 2).join(' ') + ' ';
          res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
          await new Promise((r) => setTimeout(r, 15));
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
        return;
      } catch (streamErr: unknown) {
        const msg = streamErr instanceof Error ? streamErr.message : 'Chat streaming failure';
        res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
        res.end();
        return;
      }
    }

    const answer = await answerBriefQuestion(brief, trimmedQuestion, effectiveApiKey);

    return res.status(200).json({
      success: true,
      answer
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error answering question';
    return res.status(500).json({ success: false, error: message });
  }
}
