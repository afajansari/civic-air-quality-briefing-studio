import { NextRequest, NextResponse } from 'next/server';
import { answerBriefQuestion } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brief, question, apiKey = null } = body;

    if (!brief || !question || typeof question !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid brief object and question string are required' },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Question cannot be empty' },
        { status: 400 }
      );
    }

    if (trimmedQuestion.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Question exceeds maximum limit of 1,000 characters' },
        { status: 413 }
      );
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

    const answer = await answerBriefQuestion(brief, trimmedQuestion, effectiveApiKey);

    return NextResponse.json({
      success: true,
      answer
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error answering question';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
