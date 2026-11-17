import type { NextApiRequest, NextApiResponse } from 'next';
import { parseMessyData } from '@/lib/parser';
import { generateCivicBrief } from '@/lib/gemini';
import { compareBriefs } from '@/lib/brief-comparator';
import { getLatestBrief, saveBrief } from '@/lib/storage';
import { AqiStandard, LanguageCode, PersonaType, ReadingLevel } from '@/types';

const VALID_PERSONAS: PersonaType[] = ['ward_officer', 'housing_society', 'school', 'healthcare'];
const VALID_STANDARDS: AqiStandard[] = ['cpcb', 'epa'];
const VALID_LANGUAGES: LanguageCode[] = ['en', 'hi', 'es', 'mr', 'ta', 'bn'];
const VALID_READING_LEVELS: ReadingLevel[] = ['simple', 'general', 'sensitive'];

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    const {
      rawData,
      persona = 'ward_officer',
      standard = 'cpcb',
      language = 'en',
      readingLevel = 'general',
      apiKey = null,
      model = 'gemini-1.5-flash',
      stream = false
    } = req.body || {};

    if (!rawData || typeof rawData !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid raw data string is required' });
    }

    if (rawData.length > 5 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: 'Payload exceeds maximum allowed size (5MB). Please upload a smaller sample.'
      });
    }

    const safePersona: PersonaType = VALID_PERSONAS.includes(persona) ? persona : 'ward_officer';
    const safeStandard: AqiStandard = VALID_STANDARDS.includes(standard) ? standard : 'cpcb';
    const safeLanguage: LanguageCode = VALID_LANGUAGES.includes(language) ? language : 'en';
    const safeReadingLevel: ReadingLevel = VALID_READING_LEVELS.includes(readingLevel) ? readingLevel : 'general';

    let safeApiKey: string | null = null;
    if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0 && apiKey.length < 256) {
      safeApiKey = apiKey.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '');
    }

    const parsedData = parseMessyData(rawData, safeStandard);
    if (!parsedData.success) {
      return res.status(400).json({ success: false, error: parsedData.error });
    }

    const latestBrief = getLatestBrief();

    const effectiveApiKey =
      safeApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPEN_ROUTER_API_KEY ||
      null;

    const safeModel =
      typeof model === 'string' && (model.startsWith('gemini') || model.includes('/') || model.includes('google'))
        ? model
        : 'gemini-1.5-flash';

    const wantsStream =
      Boolean(req.headers.accept?.includes('text/event-stream')) ||
      Boolean(stream === true) ||
      req.query.stream === 'true';

    if (wantsStream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });

      res.write(
        `event: status\ndata: ${JSON.stringify({ status: 'analyzing', message: 'Synthesizing verified civic telemetry...' })}\n\n`
      );

      try {
        const brief = await generateCivicBrief(parsedData, {
          persona: safePersona,
          language: safeLanguage,
          readingLevel: safeReadingLevel,
          apiKey: effectiveApiKey,
          model: safeModel
        });

        const comparison = compareBriefs(brief, latestBrief);
        saveBrief(brief);

        res.write(
          `event: metadata\ndata: ${JSON.stringify({
            grapStage: brief.grapStage,
            summary: brief.summary,
            persona: brief.personaTitle,
            classification: brief.internalBriefingNote.classification
          })}\n\n`
        );

        const summaryWords = brief.internalBriefingNote.executiveSummary.split(' ');
        for (let i = 0; i < summaryWords.length; i += 4) {
          const chunk = summaryWords.slice(i, i + 4).join(' ') + ' ';
          res.write(`event: delta\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
          await new Promise((r) => setTimeout(r, 10));
        }

        res.write(
          `event: interventions\ndata: ${JSON.stringify({
            actions: brief.internalBriefingNote.prioritizedActions,
            hotspots: brief.internalBriefingNote.hotspotAnalysis,
            complianceDirectives: brief.internalBriefingNote.complianceDirectives
          })}\n\n`
        );

        res.write(
          `event: advisory\ndata: ${JSON.stringify({
            citizenAdvisory: brief.citizenAdvisory
          })}\n\n`
        );

        res.write(
          `event: traceability\ndata: ${JSON.stringify({
            traceability: brief.traceabilityList,
            integrityAudit: brief.internalBriefingNote.dataIntegrityAudit
          })}\n\n`
        );

        res.write(
          `event: complete\ndata: ${JSON.stringify({
            success: true,
            brief,
            comparison,
            parsedData
          })}\n\n`
        );
        res.end();
        return;
      } catch (streamErr: unknown) {
        const msg = streamErr instanceof Error ? streamErr.message : 'Streaming analysis failure';
        res.write(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
        res.end();
        return;
      }
    }

    const brief = await generateCivicBrief(parsedData, {
      persona: safePersona,
      language: safeLanguage,
      readingLevel: safeReadingLevel,
      apiKey: effectiveApiKey,
      model: safeModel
    });

    const comparison = compareBriefs(brief, latestBrief);
    saveBrief(brief);

    return res.status(200).json({
      success: true,
      brief,
      comparison,
      parsedData
    });
  } catch (err: unknown) {
    console.error('Error in /api/analyze:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ success: false, error: message });
  }
}
