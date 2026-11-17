'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { DataIngestion, LiveTelemetryData } from '@/components/DataIngestion';
import { PersonaConfigBar } from '@/components/PersonaConfigBar';
import { KpiMetrics } from '@/components/KpiMetrics';
import { DataIntegrityPanel } from '@/components/DataIntegrityPanel';
import { BriefingNoteTab } from '@/components/BriefingNoteTab';
import { CitizenAdvisoryTab } from '@/components/CitizenAdvisoryTab';
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
  Loader2,
  RefreshCw
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
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [rawData, setRawData] = useState<string>('');
  const [currentCity, setCurrentCity] = useState<string>('Delhi');
  const [latestTelemetry, setLatestTelemetry] = useState<LiveTelemetryData | null>(null);
  const [isRefreshingLive, setIsRefreshingLive] = useState<boolean>(false);
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
    setIsMounted(true);
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

  const fetchLiveTelemetry = useCallback(async (cityName: string = 'Delhi') => {
    setIsRefreshingLive(true);
    try {
      const res = await fetch(`/api/live-aqi?city=${encodeURIComponent(cityName)}`);
      const data = await res.json();
      if (data.success && data.csvData) {
        setRawData(data.csvData);
        setCurrentCity(cityName);
        const telemetryRecord: LiveTelemetryData = {
          city: data.city || cityName,
          station: data.station || cityName,
          coordinates: data.coordinates,
          current: data.current || {},
          csvData: data.csvData
        };
        setLatestTelemetry(telemetryRecord);
        return telemetryRecord;
      } else {
        setErrorMsg(data.error || `Could not fetch live telemetry for ${cityName}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching live air quality data';
      setErrorMsg(msg);
    } finally {
      setIsRefreshingLive(false);
    }
    return null;
  }, []);

  useEffect(() => {
    const storedKey = localStorage.getItem('civic_gemini_api_key');
    if (storedKey) setApiKey(storedKey);

    fetchSavedBriefs();
    // Auto-fetch Delhi live data on component mount
    fetchLiveTelemetry('Delhi');
  }, [fetchLiveTelemetry]);

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

  const handleRefreshLive = useCallback(async () => {
    const result = await fetchLiveTelemetry(currentCity);
    if (result?.csvData) {
      handleAnalyze();
    }
  }, [fetchLiveTelemetry, currentCity, handleAnalyze]);

  useEffect(() => {
    if (rawData && !currentBrief && !isLoading) {
      handleAnalyze();
    }
  }, [handleAnalyze, rawData, currentBrief, isLoading]);

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

  const handleCityChange = useCallback((newCity: string) => {
    setCurrentCity(newCity);
    setCurrentBrief(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-16">
      <Header
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomKey={isMounted && !!apiKey}
        onOpenHistoryModal={() => setIsHistoryDrawerOpen(true)}
        savedBriefCount={savedBriefs.length}
        onRefreshLive={handleRefreshLive}
        isRefreshingLive={isRefreshingLive}
        currentCity={currentCity}
      />

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <noscript>
          <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-200 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-sm">JavaScript Required</p>
              <p className="text-amber-300 mt-0.5">
                JavaScript is required for the Civic Air Quality Briefing Studio to stream live telemetry and synthesize AI civic intelligence briefings. Please enable JavaScript in your browser settings.
              </p>
            </div>
          </div>
        </noscript>

        {errorMsg && (
          <div role="alert" className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  fetchLiveTelemetry(currentCity);
                }}
                className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-100 rounded-lg border border-rose-700 font-semibold transition focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs"
              >
                Retry Connection
              </button>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                aria-label="Dismiss error notification"
                className="text-rose-400 hover:text-white p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <section className="no-print">
          <DataIngestion
            rawData={rawData}
            setRawData={setRawData}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            currentCity={currentCity}
            onCityChange={handleCityChange}
            latestTelemetry={latestTelemetry}
            onTelemetryLoaded={setLatestTelemetry}
          />
        </section>

        <section className="no-print space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span>
                Active Telemetry Station: <strong className="text-white font-semibold">{currentCity} CAAQMS</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleRefreshLive}
              disabled={isRefreshingLive || isLoading}
              aria-label={`Refresh live data for ${currentCity}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg border border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshingLive ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isRefreshingLive ? 'Refreshing Telemetry...' : 'Refresh Live Data'}</span>
            </button>
          </div>
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
                    <div className="text-[10px] text-slate-400 font-mono">
                      Generated: {isMounted ? new Date(b.generatedAt).toLocaleString() : ''}
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
