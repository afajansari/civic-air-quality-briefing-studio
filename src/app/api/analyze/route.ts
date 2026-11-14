import { NextRequest, NextResponse } from 'next/server';
import { parseMessyData } from '@/lib/parser';
import { generateCivicBrief } from '@/lib/gemini';
import { compareBriefs } from '@/lib/brief-comparator';
import { getLatestBrief, saveBrief } from '@/lib/storage';
import { AqiStandard, LanguageCode, PersonaType, ReadingLevel } from '@/types';

export const dynamic = 'force-dynamic';

const VALID_PERSONAS: PersonaType[] = ['ward_officer', 'housing_society', 'school', 'healthcare'];
const VALID_STANDARDS: AqiStandard[] = ['cpcb', 'epa'];
const VALID_LANGUAGES: LanguageCode[] = ['en', 'hi', 'es', 'mr', 'ta', 'bn'];
const VALID_READING_LEVELS: ReadingLevel[] = ['simple', 'general', 'sensitive'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      rawData,
      persona = 'ward_officer',
      standard = 'cpcb',
      language = 'en',
      readingLevel = 'general',
      apiKey = null,
      model = 'gemini-1.5-flash'
    } = body;

    // Security check: Payload presence & size limit (max 5MB)
    if (!rawData || typeof rawData !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid raw data string is required' },
        { status: 400 }
      );
    }

    if (rawData.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Payload exceeds maximum allowed size (5MB). Please upload a smaller sample.' },
        { status: 413 }
      );
    }

    // Input sanitization against allowlisted enums
    const safePersona: PersonaType = VALID_PERSONAS.includes(persona) ? persona : 'ward_officer';
    const safeStandard: AqiStandard = VALID_STANDARDS.includes(standard) ? standard : 'cpcb';
    const safeLanguage: LanguageCode = VALID_LANGUAGES.includes(language) ? language : 'en';
    const safeReadingLevel: ReadingLevel = VALID_READING_LEVELS.includes(readingLevel) ? readingLevel : 'general';

    // Sanitize API key if provided
    let safeApiKey: string | null = null;
    if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0 && apiKey.length < 256) {
      safeApiKey = apiKey.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '');
    }

    // 1. Parse messy tabular data & audit anomalies
    const parsedData = parseMessyData(rawData, safeStandard);
    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, error: parsedData.error },
        { status: 400 }
      );
    }

    // 2. Fetch baseline or previous brief for comparison
    const latestBrief = getLatestBrief();

    // 3. Generate Civic Intelligence Brief (Gemini AI / OpenRouter + Rule Engine fallback)
    const effectiveApiKey =
      safeApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPEN_ROUTER_API_KEY ||
      null;

    const brief = await generateCivicBrief(parsedData, {
      persona: safePersona,
      language: safeLanguage,
      readingLevel: safeReadingLevel,
      apiKey: effectiveApiKey,
      model: typeof model === 'string' && (model.startsWith('gemini') || model.includes('/') || model.includes('google'))
        ? model
        : 'gemini-1.5-flash'
    });

    // 4. Compare with previous brief
    const comparison = compareBriefs(brief, latestBrief);

    // 5. Persist this brief
    saveBrief(brief);

    return NextResponse.json({
      success: true,
      brief,
      comparison,
      parsedData
    });
  } catch (err: unknown) {
    console.error('Error in /api/analyze:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
