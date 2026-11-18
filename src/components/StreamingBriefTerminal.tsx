'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  FileText,
  Heart,
  Table,
  MessageSquare,
  Printer,
  FileDown,
  AlertTriangle,
  Scale,
  MapPin,
  CheckCircle2,
  Send,
  Loader2,
  Copy,
  Check,
  TrendingUp,
  Search
} from 'lucide-react';
import {
  CivicBrief,
  PersonaType,
  AqiStandard,
  LanguageCode,
  ReadingLevel,
  BriefComparison,
  AirQualityRecord
} from '@/types';
import { resolveGrapStage, GrapStageDetails } from '@/lib/grap-rules';
import { generateLocalizedAdvisory } from '@/lib/translator';

interface StreamingBriefTerminalProps {
  brief: CivicBrief | null;
  isStreaming: boolean;
  streamingDelta?: string;
  streamingStatus?: string;
  onAnalyze: () => void;
  isLoading: boolean;
  apiKey?: string | null;
  onExportMarkdown: () => void;
  onPrint: () => void;
  persona: PersonaType;
  setPersona: (p: PersonaType) => void;
  standard: AqiStandard;
  setStandard: (s: AqiStandard) => void;
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  readingLevel: ReadingLevel;
  setReadingLevel: (r: ReadingLevel) => void;
  onRowHighlight?: (rowIndex: number) => void;
  comparison?: BriefComparison | null;
  onOpenComparisonModal?: () => void;
}

export const StreamingBriefTerminal: React.FC<StreamingBriefTerminalProps> = ({
  brief,
  isStreaming,
  streamingDelta = '',
  streamingStatus,
  onAnalyze,
  isLoading,
  apiKey,
  onExportMarkdown,
  onPrint,
  persona,
  setPersona,
  standard,
  setStandard,
  language,
  setLanguage,
  readingLevel,
  setReadingLevel,
  onRowHighlight,
  comparison,
  onOpenComparisonModal
}) => {
  const [activeTab, setActiveTab] = useState<'note' | 'advisory' | 'traceability' | 'chat'>('note');
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your Civic Intelligence Analyst. Ask me anything regarding this brief, sensor anomalies, hotspot drivers, or CPCB GRAP compliance protocols.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Traceability table search state
  const [traceSearch, setTraceSearch] = useState('');
  const [filterAnomaliesOnly, setFilterAnomaliesOnly] = useState(false);

  // Determine GRAP stage details
  const grapStage: GrapStageDetails | null = React.useMemo(() => {
    if (brief?.grapStage) return brief.grapStage;
    if (brief?.summary?.averageAQI != null) {
      return resolveGrapStage(brief.summary.averageAQI);
    }
    return null;
  }, [brief]);

  // Handle Chat Submit
  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading || !brief) return;
    const userQ = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userQ }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          question: userQ,
          apiKey: apiKey || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${data.error}` }]);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Chat connection error';
      setChatMessages((prev) => [...prev, { role: 'assistant', text: `Failed to connect: ${msg}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Localized advisory generator for the advisory tab
  const activeAdvisory = React.useMemo(() => {
    if (!brief) return null;
    return generateLocalizedAdvisory(
      {
        summary: brief.summary,
        totalRecords: brief.summary.totalStations,
        completenessPercent: brief.completenessPercent,
        standard,
        headerMap: {},
        stations: brief.stations,
        records: [],
        anomalies: brief.anomalies,
        dataGaps: brief.dataGaps,
        success: true,
        formatDetected: 'csv'
      },
      language,
      readingLevel
    );
  }, [brief, language, readingLevel, standard]);

  // Flattened records for traceability tab
  const allRecords: AirQualityRecord[] = React.useMemo(() => {
    if (!brief) return [];
    const list: AirQualityRecord[] = [];
    (brief.stations || []).forEach((st) => {
      (st.records || []).forEach((r) => list.push(r));
    });
    return list.sort((a, b) => a.rowIndex - b.rowIndex);
  }, [brief]);

  const filteredRecords = React.useMemo(() => {
    return allRecords.filter((r) => {
      const matchesSearch =
        r.station.toLowerCase().includes(traceSearch.toLowerCase()) ||
        r.timestamp.toLowerCase().includes(traceSearch.toLowerCase()) ||
        String(r.rowIndex).includes(traceSearch);
      const matchesAnomaly = filterAnomaliesOnly ? r.issues.length > 0 : true;
      return matchesSearch && matchesAnomaly;
    });
  }, [allRecords, traceSearch, filterAnomaliesOnly]);

  const handleCopyWhatsApp = () => {
    if (!activeAdvisory) return;
    const text = `🚨 *${activeAdvisory.urgency}* 🚨\n*${activeAdvisory.title}*\n\n📢 *Community Summary:*\n${activeAdvisory.summary}\n\n👶 *For Children & Schools:*\n${activeAdvisory.sections.children.tips.map((t) => `• ${t}`).join('\n')}\n\n👵 *For Older Adults & Seniors:*\n${activeAdvisory.sections.seniors.tips.map((t) => `• ${t}`).join('\n')}\n\n🫁 *For Asthma & Heart Patients:*\n${activeAdvisory.sections.sensitive.tips.map((t) => `• ${t}`).join('\n')}\n\n✅ *What To Do:*\n${activeAdvisory.sections.dos.map((t) => `✓ ${t}`).join('\n')}\n\n❌ *What To Avoid:*\n${activeAdvisory.sections.donts.map((t) => `✗ ${t}`).join('\n')}\n\nIssued by Civic Air Quality Briefing Studio`;

    navigator.clipboard.writeText(text);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 2500);
  };

  const handleSelectRow = (rowIdx: number) => {
    setHighlightedRow(rowIdx);
    setActiveTab('traceability');
    if (onRowHighlight) onRowHighlight(rowIdx);
    setTimeout(() => {
      const el = document.getElementById(`trace-terminal-row-${rowIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col space-y-4 p-4 sm:p-5 text-card-foreground">
      {/* Top Header & Terminal Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20 text-primary" aria-hidden="true">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black tracking-tight text-foreground uppercase">
              Streaming Civic Intelligence Terminal
            </h2>
            {isStreaming && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 animate-pulse font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                STREAMING LIVE
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            CPCB GRAP statutory directives, persona-grounded interventions & conversational AI
          </p>
        </div>

        {/* Synthesize & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Persona & Standard Quick Selectors */}
          <div className="flex items-center gap-1.5">
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as PersonaType)}
              aria-label="Target Persona"
              className="bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="ward_officer">Ward Officer</option>
              <option value="housing_society">Housing Society</option>
              <option value="school">School</option>
              <option value="healthcare">Healthcare</option>
            </select>
            <button
              type="button"
              onClick={() => setStandard(standard === 'cpcb' ? 'epa' : 'cpcb')}
              className="text-[10px] font-mono font-bold px-2 py-1.5 rounded-lg bg-slate-950 text-cyan-400 border border-slate-800 hover:border-cyan-500 uppercase transition"
              title="Toggle AQI Standard"
            >
              {standard}
            </button>
          </div>

          {brief && (
            <>
              <button
                type="button"
                onClick={onExportMarkdown}
                title="Export verified brief as Markdown"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition"
              >
                <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Export MD</span>
              </button>
              <button
                type="button"
                onClick={onPrint}
                title="Print official administrative memorandum"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onAnalyze}
            disabled={isLoading || isStreaming}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            {isLoading || isStreaming ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            )}
            <span>{isLoading || isStreaming ? 'Synthesizing...' : 'Synthesize Brief'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Streaming Token Renderer with Animated Pulse */}
      {(isStreaming || (isLoading && !brief)) && (
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-inner space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span>SSE STREAM PIPELINE ACTIVE</span>
            </span>
            <span className="text-slate-400">
              {streamingStatus || 'Parsing raw telemetry and deriving CPCB breakpoints...'}
            </span>
          </div>

          <div className="font-mono text-xs text-slate-200 leading-relaxed min-h-[60px] max-h-48 overflow-y-auto">
            {streamingDelta ? (
              <span>
                {streamingDelta}
                <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
              </span>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 italic">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Receiving live streaming tokens from civic reasoning engine...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prominent CPCB GRAP Regulatory Mandate Banner */}
      {grapStage && (
        <div
          className={`p-4 rounded-xl border ${grapStage.borderColor} ${grapStage.bannerBg} space-y-2.5 transition-all`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale className={`w-4 h-4 ${grapStage.textColor} shrink-0`} />
              <span className={`text-xs font-black uppercase tracking-wider ${grapStage.textColor}`}>
                CPCB / CAQM STATUTORY MANDATE • {grapStage.stageName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${grapStage.badgeColor}`}>
                AQI {grapStage.aqiRange} ({grapStage.severityLevel})
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {grapStage.primaryMandate}
          </p>

          {/* Enforcing Authorities & Key Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
            {grapStage.actions.slice(0, 2).map((act, i) => (
              <div key={i} className="text-[11px] bg-slate-950/60 rounded-lg p-2 border border-slate-800/80 space-y-0.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-bold text-white line-clamp-1">{act.measure}</span>
                </div>
                <div className="text-[10px] text-cyan-400 font-mono flex items-center justify-between pt-0.5">
                  <span>Enforcing: {act.enforcingAuthority}</span>
                  <span className="text-slate-500">{act.legalBasis}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retrospective Comparison Alert Bar */}
      {comparison && comparison.hasPrevious && (
        <div
          onClick={onOpenComparisonModal}
          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-2 text-xs ${
            comparison.aqiTrend === 'worsening'
              ? 'bg-rose-950/30 border-rose-800/50 hover:bg-rose-950/50'
              : comparison.aqiTrend === 'improving'
              ? 'bg-emerald-950/30 border-emerald-800/50 hover:bg-emerald-950/50'
              : 'bg-slate-950 border-slate-800 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp
              className={`w-4 h-4 shrink-0 ${
                comparison.aqiTrend === 'worsening' ? 'text-rose-400' : 'text-emerald-400'
              }`}
            />
            <span className="font-bold text-white break-words">
              {comparison.changeSummaryText || 'Comparison with previous brief recorded.'}
            </span>
          </div>
          <span className="text-[11px] text-cyan-400 font-semibold shrink-0 hover:underline">
            Inspect Diff →
          </span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('note')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'note'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Briefing Note</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advisory')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'advisory'
              ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Citizen Advisory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('traceability')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'traceability'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Traceability & Audit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'chat'
              ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Analyst Chat</span>
        </button>
      </div>

      {/* Tab 1: Briefing Note */}
      {activeTab === 'note' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {!brief ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2 bg-slate-950/60 rounded-xl border border-slate-800">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No active brief synthesized yet</p>
              <p className="text-[11px] text-slate-500">
                Click &ldquo;Synthesize Brief&rdquo; above to run the civic reasoning engine.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Executive Intelligence Summary
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Doc Ref: {brief.internalBriefingNote.docRef}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {brief.internalBriefingNote.executiveSummary}
                </p>
              </div>

              {/* Hotspot Diagnoses */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Hotspot Diagnoses & Likely Environmental Drivers
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950">
                        <th className="py-2.5 px-3">Station</th>
                        <th className="py-2.5 px-3">Peak AQI</th>
                        <th className="py-2.5 px-3">Peak Time</th>
                        <th className="py-2.5 px-3">Likely Causes</th>
                        <th className="py-2.5 px-3">Grounding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/50">
                      {brief.internalBriefingNote.hotspotAnalysis.map((hs, i) => (
                        <tr key={i} className="hover:bg-slate-850/40">
                          <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            {hs.station}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-extrabold text-rose-400">{hs.peakAQI}</span>
                            <span className="text-[10px] text-slate-400 ml-1">({hs.severity})</span>
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-mono text-[11px]">{hs.peakTime}</td>
                          <td className="py-2 px-3 text-slate-300">{hs.likelyCauses}</td>
                          <td className="py-2 px-3">
                            {hs.peakRow ? (
                              <button
                                type="button"
                                onClick={() => handleSelectRow(hs.peakRow!)}
                                className="text-cyan-400 hover:underline font-mono text-[11px]"
                              >
                                Row #{hs.peakRow}
                              </button>
                            ) : (
                              <span className="text-slate-500 font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Prioritized Municipal & Community Actions */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Prioritized Interventions (Tailored for {brief.personaTitle})
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {brief.internalBriefingNote.prioritizedActions.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-850/40 transition space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                              act.priority === 'Critical'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : act.priority === 'High'
                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {act.priority}
                          </span>
                          <span className="text-xs font-bold text-white">{act.action}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {act.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Responsible: <strong className="text-slate-200">{act.responsible}</strong></span>
                        <span>Timeframe: <strong className="text-slate-200">{act.timeframe}</strong></span>
                        <span>Impact: <strong className="text-emerald-400">{act.impact}</strong></span>
                      </div>
                      <div className="text-[10px] text-cyan-400/80 font-mono">
                        Grounding: {act.groundedIn}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regulatory Directives */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Enforcement Directives & Statutory Audit
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  {brief.internalBriefingNote.complianceDirectives.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Citizen Advisory */}
      {activeTab === 'advisory' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {!activeAdvisory ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2 bg-slate-950/60 rounded-xl border border-slate-800">
              <Heart className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No advisory data generated</p>
              <p className="text-[11px] text-slate-500">Synthesize a brief to produce multilingual citizen alerts.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controls bar: Language, Level, Copy */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Language:</span>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                      className="bg-slate-900 text-xs text-white border border-slate-700 rounded px-2 py-1 focus:outline-none"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="mr">मराठी (Marathi)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="bn">বাংলা (Bengali)</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Reading Level:</span>
                    <select
                      value={readingLevel}
                      onChange={(e) => setReadingLevel(e.target.value as ReadingLevel)}
                      className="bg-slate-900 text-xs text-white border border-slate-700 rounded px-2 py-1 focus:outline-none"
                    >
                      <option value="general">General Public</option>
                      <option value="simple">Simple / Low-Literacy</option>
                      <option value="sensitive">Vulnerable Clinical Focus</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-slate-950 transition"
                >
                  {copiedBroadcast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBroadcast ? 'Copied WhatsApp Post' : 'Copy Broadcast'}</span>
                </button>
              </div>

              {/* Advisory Title & Urgency */}
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                  <span>{activeAdvisory.urgency}</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Lang: {language} • {readingLevel}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {activeAdvisory.title}
                </h3>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {activeAdvisory.summary}
                </p>
              </div>

              {/* Grouped Vulnerable Cohort Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300">
                    {activeAdvisory.sections.children.title}
                  </h4>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {activeAdvisory.sections.children.tips.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-400">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300">
                    {activeAdvisory.sections.seniors.title}
                  </h4>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {activeAdvisory.sections.seniors.tips.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-rose-300">
                    {activeAdvisory.sections.sensitive.title}
                  </h4>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {activeAdvisory.sections.sensitive.tips.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-400">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Do's and Don'ts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1.5">
                  <h4 className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Recommended Actions (What To Do)
                  </h4>
                  <ul className="space-y-1 text-[11px] text-slate-200">
                    {activeAdvisory.sections.dos.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1.5">
                  <h4 className="text-xs font-extrabold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Strict Restrictions (What To Avoid)
                  </h4>
                  <ul className="space-y-1 text-[11px] text-slate-200">
                    {activeAdvisory.sections.donts.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">✗</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Traceability & Telemetry Audit */}
      {activeTab === 'traceability' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {!brief ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2 bg-slate-950/60 rounded-xl border border-slate-800">
              <Table className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No traceability data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Integrity Score & Anomalies Bar */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-semibold">Completeness:</span>
                  <span className="font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {brief.completenessPercent}%
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-400">
                    Flagged Anomalies: <strong className="text-amber-400">{brief.anomalies.length}</strong>
                  </span>
                  <span className="text-slate-400">
                    Data Gaps: <strong className="text-slate-200">{brief.dataGaps.length}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={traceSearch}
                      onChange={(e) => setTraceSearch(e.target.value)}
                      placeholder="Filter row or station..."
                      className="bg-slate-900 text-xs text-white pl-8 pr-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 w-36"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterAnomaliesOnly((prev) => !prev)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      filterAnomaliesOnly
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Anomalies Only
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-800 scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Row #</th>
                      <th className="py-2 px-3">Station</th>
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3">AQI</th>
                      <th className="py-2 px-3">PM2.5</th>
                      <th className="py-2 px-3">PM10</th>
                      <th className="py-2 px-3">NO2</th>
                      <th className="py-2 px-3">Issues / Anomalies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono text-[11px]">
                    {filteredRecords.map((rec) => {
                      const isHighlighted = highlightedRow === rec.rowIndex;
                      return (
                        <tr
                          key={rec.rowIndex}
                          id={`trace-terminal-row-${rec.rowIndex}`}
                          className={`hover:bg-slate-850/60 transition ${
                            isHighlighted ? 'bg-cyan-500/15 ring-1 ring-cyan-500/50' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-cyan-400 font-bold">#{rec.rowIndex}</td>
                          <td className="py-2 px-3 text-white font-sans font-semibold">{rec.station}</td>
                          <td className="py-2 px-3 text-slate-300">{rec.timestamp}</td>
                          <td className="py-2 px-3 font-bold text-slate-100">{rec.aqi}</td>
                          <td className="py-2 px-3 text-slate-300">{rec.pollutants.pm25 ?? '—'}</td>
                          <td className="py-2 px-3 text-slate-300">{rec.pollutants.pm10 ?? '—'}</td>
                          <td className="py-2 px-3 text-slate-300">{rec.pollutants.no2 ?? '—'}</td>
                          <td className="py-2 px-3">
                            {rec.issues.length > 0 ? (
                              <span className="text-[10px] text-amber-400 font-sans font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                                {rec.issues.map((i) => i.message).join(', ')}
                              </span>
                            ) : (
                              <span className="text-emerald-500 font-sans text-[10px]">Verified</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Interactive AI Chat Assistant */}
      {activeTab === 'chat' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Civic AI Analyst • Persona: {brief?.personaTitle || 'Ward Officer'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Grounded in active telemetry
            </span>
          </div>

          {/* Chat Messages */}
          <div className="h-64 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 scrollbar-thin">
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 text-xs leading-relaxed ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`p-3 rounded-xl max-w-[85%] ${
                    m.role === 'user'
                      ? 'bg-cyan-600 text-slate-950 font-semibold rounded-tr-none'
                      : 'bg-slate-850 text-slate-200 border border-slate-700/80 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-purple-400 italic p-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Formulating grounded response...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {[
              'What was the peak hotspot reading?',
              'What are mandatory school restrictions today?',
              'Explain CPCB GRAP Stage enforcement'
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setChatInput(p)}
                className="text-[10px] text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-850 border border-slate-800 px-2 py-1 rounded-lg transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input & Send */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
              placeholder="Ask about readings, sensor anomalies, or local protocols..."
              className="flex-1 bg-slate-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
