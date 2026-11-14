/**
 * Civic Air Quality Briefing Studio - AI Civic Intelligence Engine
 * Integrates Google Gemini API with strict grounding, traceability,
 * persona-specific action prioritization, and high-fidelity deterministic fallback.
 */

import https from 'https';
import { generateLocalizedAdvisory } from './translator';
import {
  CivicBrief,
  HotspotDiagnosis,
  LanguageCode,
  ParsedDataSet,
  PersonaType,
  PrioritizedAction,
  ReadingLevel,
  TraceabilityItem
} from '../types';

export const PERSONA_CONFIG: Record<PersonaType, {
  title: string;
  roleDescription: string;
  primaryInterventions: Array<{
    action: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    timeframe: string;
    responsible: string;
    impact: string;
  }>;
}> = {
  ward_officer: {
    title: 'Ward Officer & Municipal Team',
    roleDescription: 'Municipal administration, street-level enforcement, mechanized sweeping, and dust suppression',
    primaryInterventions: [
      {
        action: 'Deploy Anti-Smog Mist Cannons along Identified Hotspot Corridors',
        priority: 'High',
        timeframe: 'Immediate (within 2 hours)',
        responsible: 'Sanitation & Mechanized Cleaning Unit',
        impact: 'High'
      },
      {
        action: 'Enforce Mandatory Water Sprinkling at Active Construction & Demolition (C&D) Sites',
        priority: 'High',
        timeframe: 'Same-day morning inspections',
        responsible: 'Ward Enforcement Squad & Building Dept',
        impact: 'High'
      },
      {
        action: 'Issue Temporary Halt on Diesel Generator Operations for Commercial Establishments',
        priority: 'Medium',
        timeframe: 'Effective 06:00 - 20:00',
        responsible: 'Pollution Control & Municipal Inspectors',
        impact: 'Medium'
      },
      {
        action: 'Traffic Police Coordination: Reroute Heavy Commercial Freight Away from Choke Points',
        priority: 'Medium',
        timeframe: 'During morning peak (07:30 - 11:00)',
        responsible: 'Traffic Warden Division',
        impact: 'Medium'
      }
    ]
  },
  housing_society: {
    title: 'Housing Society & Apartment RWA',
    roleDescription: 'Residential Welfare Associations, facility managers, and gated community management',
    primaryInterventions: [
      {
        action: 'Activate High-Capacity HEPA Air Purifiers in Society Common Rooms, Clubhouses & Basements',
        priority: 'High',
        timeframe: 'Continuous operation throughout high-AQI hours',
        responsible: 'Society Estate Manager',
        impact: 'High'
      },
      {
        action: 'Prohibit Dry Sweeping of Society Driveways; Switch to Damp Mop & Water Misting Only',
        priority: 'High',
        timeframe: 'Immediate morning routine shift',
        responsible: 'Housekeeping Staff Supervisor',
        impact: 'Medium'
      },
      {
        action: 'Reschedule Outdoor Gardening, Lawn Mowing, and Leaf Blower Usage',
        priority: 'Medium',
        timeframe: 'Defer until air quality returns to Satisfactory/Moderate',
        responsible: 'Landscape Maintenance Contractor',
        impact: 'Medium'
      },
      {
        action: 'Broadcast Resident Advisory on WhatsApp: Move Outdoor Yoga & Elderly Morning Walks Indoors',
        priority: 'High',
        timeframe: 'Send before 06:30 AM',
        responsible: 'RWA Management Committee',
        impact: 'High'
      }
    ]
  },
  school: {
    title: 'School & Educational Institution',
    roleDescription: 'School principals, physical education directors, daycares, and campus administrators',
    primaryInterventions: [
      {
        action: 'Suspend Outdoor Physical Education (PE) & Morning Assembly; Conduct in Closed Auditorium',
        priority: 'Critical',
        timeframe: 'Immediate morning school hours',
        responsible: 'Head of Physical Education & Principal',
        impact: 'Critical'
      },
      {
        action: 'Enforce Strict Zero-Idling Zone for School Buses and Parent Pickup Vehicles',
        priority: 'High',
        timeframe: 'During morning drop-off & afternoon dismissal',
        responsible: 'Campus Security & Transport Coordinator',
        impact: 'High'
      },
      {
        action: 'Activate Asthma Action Protocols: Verify Rescue Inhalers with Class Teachers & Infirmary',
        priority: 'High',
        timeframe: 'Immediate nurse station alert',
        responsible: 'School Medical Officer & Class Teachers',
        impact: 'High'
      },
      {
        action: 'Advise Certified N95 Mask Usage for Commutes on Non-Air Conditioned School Transports',
        priority: 'Medium',
        timeframe: 'Circular to all parents via school portal',
        responsible: 'Administration Office',
        impact: 'High'
      }
    ]
  },
  healthcare: {
    title: 'Healthcare Facility & Elder Care',
    roleDescription: 'Community health clinics, nursing homes, assisted living, and elder care centers',
    primaryInterventions: [
      {
        action: 'Pre-charge Dedicated Nebulizer Stations and Stock Salbutamol / Corticosteroid Inhalers',
        priority: 'Critical',
        timeframe: 'Triage readiness for morning surge',
        responsible: 'Chief Medical Officer / Head Nurse',
        impact: 'Critical'
      },
      {
        action: 'Send Automated SMS/WhatsApp Alerts to Registered COPD & Cardiac Outpatients',
        priority: 'High',
        timeframe: 'Early morning automated dispatch',
        responsible: 'Outpatient Department Coordinator',
        impact: 'High'
      },
      {
        action: 'Establish Positive-Pressure Clean Air Sanctuaries for Vulnerable Inpatients & Residents',
        priority: 'High',
        timeframe: 'Immediate HVAC air filtration boost',
        responsible: 'Facility Engineering Team',
        impact: 'High'
      },
      {
        action: 'Distribute Fitted Respirators (N95) to Frontline Healthcare Workers & Vulnerable Walk-ins',
        priority: 'Medium',
        timeframe: 'At main clinic reception & triage desk',
        responsible: 'Clinic Administration',
        impact: 'Medium'
      }
    ]
  }
};

function resolveOpenRouterModel(model: string): string {
  if (model.includes('/')) return model;
  if (model.includes('2.0') || model.includes('exp')) {
    return 'google/gemini-2.0-flash-exp:free';
  }
  if (model.includes('pro')) {
    return 'google/gemini-pro-1.5';
  }
  return 'google/gemini-flash-1.5';
}

function callOpenRouterAPI(
  apiKey: string,
  prompt: string,
  systemInstruction = '',
  model = 'gemini-1.5-flash'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const resolvedModel = resolveOpenRouterModel(model);
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const payload = JSON.stringify({
      model: resolvedModel,
      messages,
      temperature: 0.2,
      max_tokens: 2500
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://civic-air-quality-briefing-studio.vercel.app',
        'X-Title': 'Civic Air Quality Briefing Studio',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const text = json.choices?.[0]?.message?.content;
            if (text) {
              resolve(text);
            } else {
              reject(new Error('Empty candidate response from OpenRouter API'));
            }
          } else {
            const errMsg = json.error?.message || json.message || `OpenRouter API error with status ${res.statusCode}`;
            reject(new Error(errMsg));
          }
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'Unknown parse error';
          reject(new Error(`Failed to parse OpenRouter API response: ${message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Network error calling OpenRouter API: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout waiting for OpenRouter API response'));
    });

    req.write(payload);
    req.end();
  });
}

function callGoogleGeminiAPI(
  apiKey: string,
  prompt: string,
  systemInstruction = '',
  model = 'gemini-1.5-flash'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: systemInstruction ? {
        parts: [{ text: systemInstruction }]
      } : undefined,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 2500
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 25000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              resolve(text);
            } else {
              reject(new Error('Empty candidate response from Gemini API'));
            }
          } else {
            const errMsg = json.error?.message || `Gemini API error with status ${res.statusCode}`;
            reject(new Error(errMsg));
          }
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'Unknown parse error';
          reject(new Error(`Failed to parse Gemini API response: ${message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Network error calling Gemini API: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout waiting for Gemini API response'));
    });

    req.write(payload);
    req.end();
  });
}

export async function callGeminiAPI(
  apiKey: string,
  prompt: string,
  systemInstruction = '',
  model = 'gemini-1.5-flash'
): Promise<string> {
  const isOpenRouter = apiKey.startsWith('sk-or-') || Boolean(process.env.OPENROUTER_API_KEY);
  if (isOpenRouter) {
    return await callOpenRouterAPI(apiKey, prompt, systemInstruction, model);
  }
  return await callGoogleGeminiAPI(apiKey, prompt, systemInstruction, model);
}

export async function generateCivicBrief(
  parsedData: ParsedDataSet,
  options: {
    persona?: PersonaType;
    language?: LanguageCode;
    readingLevel?: ReadingLevel;
    apiKey?: string | null;
    model?: string;
  } = {}
): Promise<CivicBrief> {
  const {
    persona = 'ward_officer',
    language = 'en',
    readingLevel = 'general',
    apiKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || null,
    model = 'gemini-1.5-flash'
  } = options;

  const personaConfig = PERSONA_CONFIG[persona] || PERSONA_CONFIG.ward_officer;
  const summary = parsedData.summary;
  const stations = parsedData.stations || [];
  const anomalies = parsedData.anomalies || [];
  const dataGaps = parsedData.dataGaps || [];

  const deterministicAdvisory = generateLocalizedAdvisory(parsedData, language, readingLevel);

  const traceabilityList: TraceabilityItem[] = [];
  stations.forEach(st => {
    traceabilityList.push({
      claim: `${st.station}: Average AQI ${st.averageAQI} (${st.category}), peaking at AQI ${st.peakAQI}`,
      source: `Underlying telemetry readings (${st.readingCount} observations)`,
      peakRow: st.peakRow,
      timestamp: st.peakTime,
      metricValue: `${st.peakAQI} AQI / ${st.peakPM25 || 'N/A'} µg/m³ PM2.5`,
      confidence: st.readingCount >= 10 ? 'High' : 'Moderate (Limited Sample)'
    });
  });

  const hotspotAnalysis: HotspotDiagnosis[] = [];
  stations.filter(s => s.isHotspot).forEach(st => {
    let likelyCause = 'Mixed industrial/vehicular congestion and calm nocturnal boundary layer trapping.';
    if (st.station.toLowerCase().includes('traffic') || st.station.toLowerCase().includes('road') || st.station.toLowerCase().includes('chowk')) {
      likelyCause = 'High vehicular idling, stop-and-go traffic emissions, and diesel exhaust accumulation during commute peaks.';
    } else if (st.station.toLowerCase().includes('industrial') || st.station.toLowerCase().includes('phase') || st.station.toLowerCase().includes('plant')) {
      likelyCause = 'Point-source industrial boiler emissions, stack plumes, and heavy transport movements.';
    } else if (st.station.toLowerCase().includes('vihar') || st.station.toLowerCase().includes('society') || st.station.toLowerCase().includes('residential')) {
      likelyCause = 'Localized biomass burning, residential diesel genset operation, and unpaved shoulder dust.';
    }
    hotspotAnalysis.push({
      station: st.station,
      severity: st.category,
      peakAQI: st.peakAQI,
      peakTime: st.peakTime,
      peakRow: st.peakRow,
      likelyCauses: likelyCause,
      recommendedIntervention: personaConfig.primaryInterventions[0]?.action || 'Localized mist cannon deployment'
    });
  });

  const prioritizedActions: PrioritizedAction[] = (personaConfig.primaryInterventions || []).map((action, idx) => ({
    id: `action-${idx + 1}`,
    action: action.action,
    priority: action.priority,
    timeframe: action.timeframe,
    responsible: action.responsible,
    impact: action.impact,
    groundedIn: `Triggered by ${summary.dominantPollutant} average of ${summary.averageAQI} AQI peaking at ${summary.peakLocation} (Row ${summary.peakRowIndex || 1})`,
    status: 'Recommended'
  }));

  const internalBriefingNote = {
    docRef: `AQ-BRIEF-${Date.now().toString(36).toUpperCase()}`,
    date: new Date().toISOString().split('T')[0],
    targetAudience: personaConfig.title,
    classification: summary.peakAQI > 300 ? 'URGENT REGULATORY ACTION REQUIRED' : 'OFFICIAL CIVIC INTELLIGENCE NOTE',
    executiveSummary: `Analysis of ${parsedData.totalRecords} telemetry readings across ${stations.length} monitoring sites indicates an overall ambient AQI of ${summary.averageAQI} (${summary.category}), with ${summary.dominantPollutant} as the primary driving contaminant. Critical hotspot identified at ${summary.peakLocation} with peak AQI reaching ${summary.peakAQI} at ${summary.peakTimestamp}. Data integrity audit confirmed a telemetry completeness score of ${parsedData.completenessPercent}%, with ${anomalies.length} sensor anomalies and ${dataGaps.length} telemetry gaps identified and isolated.`,
    metrics: {
      overallAQI: summary.averageAQI,
      category: summary.category,
      peakAQI: summary.peakAQI,
      peakLocation: summary.peakLocation,
      peakTime: summary.peakTimestamp,
      dominantPollutant: summary.dominantPollutant,
      completenessScore: `${parsedData.completenessPercent}%`,
      activeHotspots: summary.hotspotCount
    },
    hotspotAnalysis,
    prioritizedActions,
    dataIntegrityAudit: {
      sensorAnomaliesCount: anomalies.length,
      dataGapsCount: dataGaps.length,
      anomaliesList: anomalies.slice(0, 5),
      dataGapsList: dataGaps.slice(0, 5)
    },
    complianceDirectives: [
      'Maintain continuous logging and verify sensor optical chambers for zero-drift baseline.',
      'Log execution timestamps of all municipal suppression interventions for verification in subsequent brief.'
    ]
  };

  const briefResult: CivicBrief = {
    id: `brief_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    persona,
    personaTitle: personaConfig.title,
    language,
    readingLevel,
    aiModelUsed: 'Civic Intelligence Rule Engine (Deterministic)',
    summary,
    traceabilityList,
    internalBriefingNote,
    citizenAdvisory: deterministicAdvisory,
    stations,
    anomalies,
    dataGaps,
    completenessPercent: parsedData.completenessPercent
  };

  if (apiKey) {
    try {
      const prompt = `You are the lead environmental analyst for the "Civic Air Quality Briefing Studio".
Analyze the following verified air quality dataset:
- Total records: ${parsedData.totalRecords}
- Overall AQI: ${summary.averageAQI} (${summary.category})
- Dominant Pollutant: ${summary.dominantPollutant}
- Peak Hotspot: ${summary.peakLocation} peaking at AQI ${summary.peakAQI} on ${summary.peakTimestamp} (Row ${summary.peakRowIndex})
- Target Persona: ${personaConfig.title} (${personaConfig.roleDescription})
- Target Language: ${language}
- Reading Level: ${readingLevel}
- Flagged Anomalies: ${anomalies.length} (e.g. ${anomalies.map(a => a.type).join(', ') || 'None'})
- Flagged Data Gaps: ${dataGaps.length} (e.g. ${dataGaps.map(g => g.detail).join('; ') || 'None'})

STRICT INSTRUCTIONS:
1. Every conclusion MUST be grounded strictly in the provided data.
2. Provide a plain-language summary of trends and likely local hotspot causes.
3. Provide 4 actionable, highly realistic local interventions specifically for the ${personaConfig.title}.
4. Provide a citizen advisory in ${language} at a "${readingLevel}" reading level with explicit care instructions for:
   - Children
   - Older adults
   - People sensitive to poor air (asthma/cardiac)
5. Return your output as valid JSON matching this structure:
{
  "executiveSummary": "...",
  "hotspotDiagnosis": "...",
  "recommendedInterventions": [
    { "action": "...", "priority": "High|Medium|Low", "timeframe": "...", "responsible": "...", "impact": "..." }
  ],
  "citizenAdvisorySummary": "...",
  "childrenAdvice": ["..."],
  "seniorsAdvice": ["..."],
  "sensitiveGroupsAdvice": ["..."]
}`;

      const aiResponseText = await callGeminiAPI(apiKey, prompt, 'You are an environmental civic intelligence AI expert. Always ground your answers strictly in the verified data provided. Never hallucinate data.', model);

      let cleaned = aiResponseText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      try {
        const aiJson = JSON.parse(cleaned);

        if (aiJson.executiveSummary) {
          briefResult.internalBriefingNote.executiveSummary = aiJson.executiveSummary;
        }
        if (aiJson.recommendedInterventions && Array.isArray(aiJson.recommendedInterventions)) {
          briefResult.internalBriefingNote.prioritizedActions = aiJson.recommendedInterventions.map((item: Record<string, unknown>, idx: number) => ({
            id: `gemini-action-${idx + 1}`,
            action: String(item.action || 'Local intervention'),
            priority: (item.priority === 'High' || item.priority === 'Medium' || item.priority === 'Low' ? item.priority : 'High') as 'High' | 'Medium' | 'Low',
            timeframe: String(item.timeframe || 'Immediate'),
            responsible: String(item.responsible || personaConfig.title),
            impact: String(item.impact || 'High'),
            groundedIn: `Derived from ${summary.dominantPollutant} hotspot at ${summary.peakLocation}`,
            status: 'Recommended'
          }));
        }
        if (aiJson.citizenAdvisorySummary) {
          briefResult.citizenAdvisory.summary = aiJson.citizenAdvisorySummary;
        }
        if (aiJson.childrenAdvice && Array.isArray(aiJson.childrenAdvice)) {
          briefResult.citizenAdvisory.sections.children.tips = aiJson.childrenAdvice;
        }
        if (aiJson.seniorsAdvice && Array.isArray(aiJson.seniorsAdvice)) {
          briefResult.citizenAdvisory.sections.seniors.tips = aiJson.seniorsAdvice;
        }
        if (aiJson.sensitiveGroupsAdvice && Array.isArray(aiJson.sensitiveGroupsAdvice)) {
          briefResult.citizenAdvisory.sections.sensitive.tips = aiJson.sensitiveGroupsAdvice;
        }

        const isOR = Boolean(apiKey?.startsWith('sk-or-')) || Boolean(process.env.OPENROUTER_API_KEY);
        const resolvedLabel = isOR ? `OpenRouter (${resolveOpenRouterModel(model)})` : `Google Gemini (${model})`;
        briefResult.aiModelUsed = resolvedLabel;
        briefResult.isAiEnriched = true;
      } catch {
        const isOR = Boolean(apiKey?.startsWith('sk-or-')) || Boolean(process.env.OPENROUTER_API_KEY);
        const resolvedLabel = isOR ? `OpenRouter (${resolveOpenRouterModel(model)})` : `Google Gemini (${model})`;
        briefResult.internalBriefingNote.executiveSummary = aiResponseText.slice(0, 800);
        briefResult.aiModelUsed = `${resolvedLabel} - Text Synthesis`;
      }
    } catch (apiErr: unknown) {
      const message = apiErr instanceof Error ? apiErr.message : 'API call error';
      console.warn('AI API call failed, fell back to Civic Intelligence Rule Engine:', message);
      briefResult.aiModelUsed = `Civic Intelligence Rule Engine (AI fallback: ${message})`;
      briefResult.geminiError = message;
    }
  }

  return briefResult;
}

export async function answerBriefQuestion(
  brief: CivicBrief,
  question: string,
  apiKey: string | null = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || null
): Promise<string> {
  if (!apiKey) {
    const qLower = question.toLowerCase();
    if (qLower.includes('peak') || qLower.includes('worst') || qLower.includes('highest')) {
      return `Based on the underlying data, the highest recorded peak occurred at **${brief.summary.peakLocation}** with an AQI of **${brief.summary.peakAQI}** (${brief.summary.dominantPollutant}) recorded on **${brief.summary.peakTimestamp}** (Row #${brief.summary.peakRowIndex || 1}).`;
    }
    if (qLower.includes('children') || qLower.includes('school')) {
      return `For children and schools, the primary advisory is: **${brief.citizenAdvisory.sections.children.tips.join(' ')}**`;
    }
    if (qLower.includes('senior') || qLower.includes('older') || qLower.includes('elderly')) {
      return `For older adults and seniors, the primary advice is: **${brief.citizenAdvisory.sections.seniors.tips.join(' ')}**`;
    }
    if (qLower.includes('action') || qLower.includes('do') || qLower.includes('priority')) {
      const topAction = brief.internalBriefingNote.prioritizedActions[0];
      return `Top prioritized action for **${brief.personaTitle}**: **${topAction.action}** (Priority: ${topAction.priority}, Responsible: ${topAction.responsible}, Timeframe: ${topAction.timeframe}).`;
    }
    if (qLower.includes('anomaly') || qLower.includes('gap') || qLower.includes('reliable') || qLower.includes('freeze')) {
      return `Data integrity audit found **${brief.anomalies.length} anomalies** and **${brief.dataGaps.length} telemetry dropouts**. Sensor completeness is **${brief.completenessPercent}%**. Details: ${brief.anomalies.map(a => `${a.station} (${a.type})`).join(', ') || 'No anomalies detected'}.`;
    }
    return `Analysis Summary: The ambient air quality is **AQI ${brief.summary.averageAQI} (${brief.summary.category})** dominated by **${brief.summary.dominantPollutant}**. Peak reading was **${brief.summary.peakAQI}** at **${brief.summary.peakLocation}**. Check the Internal Note and Citizen Advisory tabs for complete protocols.`;
  }

  const prompt = `You are the civic intelligence assistant for "Civic Air Quality Briefing Studio".
A user is asking a question about this specific air quality brief:
- Brief Date: ${brief.generatedAt}
- Overall AQI: ${brief.summary.averageAQI} (${brief.summary.category})
- Dominant Pollutant: ${brief.summary.dominantPollutant}
- Peak Hotspot: ${brief.summary.peakLocation} (AQI: ${brief.summary.peakAQI} at ${brief.summary.peakTimestamp}, Row: ${brief.summary.peakRowIndex})
- Persona: ${brief.personaTitle}
- Flagged Anomalies: ${JSON.stringify(brief.anomalies)}
- Flagged Gaps: ${JSON.stringify(brief.dataGaps)}
- Prioritized Actions: ${JSON.stringify(brief.internalBriefingNote.prioritizedActions)}

USER QUESTION: "${question}"

Provide a concise, highly accurate, and grounded response citing specific stations, timestamps, and row indices where relevant.`;

  return await callGeminiAPI(apiKey, prompt, 'Ground all responses strictly in the provided brief data.');
}
