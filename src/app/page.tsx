'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { DataIngestion } from '@/components/DataIngestion';
import { PersonaConfigBar } from '@/components/PersonaConfigBar';
import { KpiMetrics } from '@/components/KpiMetrics';
import { DataIntegrityPanel } from '@/components/DataIntegrityPanel';
import { BriefingNoteTab } from '@/components/BriefingNoteTab';
import { CitizenAdvisoryTab } from '@/components/CitizenAdvisoryTab';
import { AUTHENTIC_DATASETS, DatasetPreset } from '@/lib/authentic-datasets';
import {
  AqiStandard,
  BriefComparison,
  CivicBrief,
  LanguageCode,
  PersonaType,
  ReadingLevel
} from '@/types';

// Code-splitting & dynamic imports for performance optimization
const AirQualityCharts = dynamic(
  () => import('@/components/AirQualityCharts').then(m => m.AirQualityCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
      </div>
    )
  }
);

const TraceabilityTable = dynamic(
  () => import('@/components/TraceabilityTable').then(m => m.TraceabilityTable),
  {
    loading: () => <div className="h-96 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
  }
);

const AiChatAssistant = dynamic(
  () => import('@/components/AiChatAssistant').then(m => m.AiChatAssistant),
  {
    loading: () => <div className="h-48 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
  }
);

const BriefComparisonModal = dynamic(
  () => import('@/components/BriefComparisonModal').then(m => m.BriefComparisonModal),
  { ssr: false }
);

const ApiKeyModal = dynamic(
  () => import('@/components/ApiKeyModal').then(m => m.ApiKeyModal),
  { ssr: false }
);
import {
  FileText,
  Heart,
  Table,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  History,
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface SavedBriefMeta {
  id: string;
  generatedAt: string;
  personaTitle: string;
  averageAQI: number;
  category: string;
  badgeColor: string;
  dominantPollutant: string;
  peakLocation: string;
  peakAQI: number;
}

export default function Home() {
  const [rawData, setRawData] = useState<string>(AUTHENTIC_DATASETS[0].csvData);
  const [persona, setPersona] = useState<PersonaType>('ward_officer');
  const [standard, setStandard] = useState<AqiStandard>('cpcb');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>('general');

  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [currentBrief, setCurrentBrief] = useState<CivicBrief | null>(null);
  const [comparison, setComparison] = useState<BriefComparison | null>(null);
  const [savedBriefs, setSavedBriefs] = useState<SavedBriefMeta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'note' | 'advisory' | 'traceability'>('note');
  const [highlightRowIndex, setHighlightRowIndex] = useState<number | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('civic_gemini_api_key');
    if (storedKey) setApiKey(storedKey);

    fetchSavedBriefs();
  }, []);

  const fetchSavedBriefs = async () => {
    try {
      const res = await fetch('/api/briefs');
      const data = await res.json();
      if (data.success && data.briefs) {
        setSavedBriefs(data.briefs);
      }
    } catch (e) {
      console.warn('Could not fetch brief history:', e);
    }
  };

  const handleDatasetSelect = (ds: DatasetPreset) => {
    setRawData(ds.csvData);
    setStandard(ds.defaultStandard);
    if (ds.suggestedPersona) {
      setPersona(ds.suggestedPersona as PersonaType);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!rawData.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawData,
          persona,
          standard,
          language,
          readingLevel,
          apiKey: apiKey || null,
          model: selectedModel
        })
      });

      const data = await res.json();
      if (data.success) {
        setCurrentBrief(data.brief);
        setComparison(data.comparison);
        fetchSavedBriefs();
      } else {
        setErrorMsg(data.error || 'Failed to interpret data');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Network error processing analysis';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  }, [rawData, persona, standard, language, readingLevel, apiKey, selectedModel]);

  useEffect(() => {
    if (rawData && !currentBrief) {
      handleAnalyze();
    }
  }, [handleAnalyze, rawData, currentBrief]);

  const handleRowHighlight = (rowIndex: number) => {
    setHighlightRowIndex(rowIndex);
    setActiveTab('traceability');
    setTimeout(() => {
      const el = document.getElementById(`trace-row-${rowIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportMarkdown = () => {
    if (!currentBrief) return;
    const note = currentBrief.internalBriefingNote;
    const md = `# ${note.classification}
## ${note.targetAudience} - Reference: ${note.docRef}
**Date:** ${note.date}
**Overall AQI:** ${note.metrics.overallAQI} (${note.metrics.category})
**Peak Hotspot:** ${note.metrics.peakLocation} (AQI ${note.metrics.peakAQI} at ${note.metrics.peakTime})

### Executive Summary
${note.executiveSummary}

### Hotspot Analysis
${note.hotspotAnalysis.map(h => `- **${h.station}** (Peak AQI: ${h.peakAQI}): ${h.likelyCauses}`).join('\n')}

### Prioritized Actions
${note.prioritizedActions.map(a => `- **[${a.priority}] ${a.action}**\n  - Responsible: ${a.responsible}\n  - Timeframe: ${a.timeframe}\n  - Impact: ${a.impact}\n  - Grounding: ${a.groundedIn}`).join('\n')}

### Directives
${note.complianceDirectives.map(d => `- ${d}`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.docRef}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-16">
      <Header
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomKey={!!apiKey}
        onOpenHistoryModal={() => setIsHistoryDrawerOpen(true)}
        savedBriefCount={savedBriefs.length}
      />

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <section className="no-print">
          <DataIngestion
            rawData={rawData}
            setRawData={setRawData}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            onSelectDataset={handleDatasetSelect}
          />
        </section>

        <section className="no-print">
          <PersonaConfigBar
            persona={persona}
            setPersona={setPersona}
            standard={standard}
            setStandard={setStandard}
            language={language}
            setLanguage={setLanguage}
            readingLevel={readingLevel}
            setReadingLevel={setReadingLevel}
          />
        </section>

        {isLoading && (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3 animate-pulse">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <div className="text-sm font-bold text-white">
              Synthesizing Civic Intelligence Brief...
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Normalizing inconsistent units, isolating sensor anomalies, matching AQI breakpoints, and compiling grounded local interventions.
            </p>
          </div>
        )}

        {currentBrief && !isLoading && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {comparison && (
              <div
                onClick={() => setIsComparisonModalOpen(true)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-wrap items-center justify-between gap-3 ${
                  comparison.aqiTrend === 'worsening'
                    ? 'bg-rose-950/30 border-rose-800/60 hover:bg-rose-950/50'
                    : comparison.aqiTrend === 'improving'
                    ? 'bg-emerald-950/30 border-emerald-800/60 hover:bg-emerald-950/50'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      comparison.aqiTrend === 'worsening'
                        ? 'bg-rose-500/20 text-rose-400'
                        : comparison.aqiTrend === 'improving'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {comparison.aqiTrend === 'worsening' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : comparison.aqiTrend === 'improving' ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <History className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Previous Brief Comparison Engine</span>
                      {comparison.hasPrevious && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full ${
                            comparison.aqiDelta! > 0
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {comparison.aqiDelta! > 0 ? `+${comparison.aqiDelta}` : comparison.aqiDelta} AQI pts
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                      {comparison.hasPrevious
                        ? comparison.changeSummaryText
                        : 'Baseline brief recorded. Click to inspect comparison metrics.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-cyan-400 font-semibold shrink-0">
                  <span>View Full Change Diff</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            <KpiMetrics brief={currentBrief} onRowClick={handleRowHighlight} />

            <AirQualityCharts brief={currentBrief} />

            <DataIntegrityPanel brief={currentBrief} onSelectAnomaly={handleRowHighlight} />

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('note')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    activeTab === 'note'
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>1. Internal Briefing Note (Administrative)</span>
                </button>

                <button
                  onClick={() => setActiveTab('advisory')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    activeTab === 'advisory'
                      ? 'bg-rose-500 text-slate-950 shadow-lg shadow-rose-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>2. Citizen Advisory (Multilingual & Vulnerable Care)</span>
                </button>

                <button
                  onClick={() => setActiveTab('traceability')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    activeTab === 'traceability'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span>3. Traceability & Telemetry Audit Table</span>
                </button>
              </div>

              {activeTab === 'note' && (
                <BriefingNoteTab
                  brief={currentBrief}
                  onPrint={handlePrint}
                  onExportMarkdown={handleExportMarkdown}
                />
              )}

              {activeTab === 'advisory' && (
                <CitizenAdvisoryTab
                  brief={currentBrief}
                  onPrint={handlePrint}
                />
              )}

              {activeTab === 'traceability' && (
                <TraceabilityTable
                  brief={currentBrief}
                  highlightRowIndex={highlightRowIndex}
                />
              )}
            </div>

            <AiChatAssistant brief={currentBrief} apiKey={apiKey || null} />
          </div>
        )}
      </main>

      <BriefComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        comparison={comparison}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />

      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Briefs Archive & History</h3>
              </div>
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {savedBriefs.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-10">
                No past briefs stored yet.
              </div>
            ) : (
              <div className="space-y-3">
                {savedBriefs.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white capitalize">{b.personaTitle}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.badgeColor}`}>
                        AQI {b.averageAQI} ({b.category})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Peak: {b.peakLocation} (AQI {b.peakAQI})
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Generated: {new Date(b.generatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
