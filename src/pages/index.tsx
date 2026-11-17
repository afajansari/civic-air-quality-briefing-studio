import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { ModernUtilityHeader } from '@/components/ModernUtilityHeader';
import { CommandPalette } from '@/components/CommandPalette';
import { LiveTelemetryStudio } from '@/components/LiveTelemetryStudio';
import { StreamingBriefTerminal } from '@/components/StreamingBriefTerminal';
import { PersonaConfigBar } from '@/components/PersonaConfigBar';
import {
  AqiStandard,
  BriefComparison,
  CivicBrief,
  LanguageCode,
  PersonaType,
  ReadingLevel
} from '@/types';
import { LiveTelemetryData } from '@/components/DataIngestion';
import {
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  History,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const BriefComparisonModal = dynamic(
  () => import('@/components/BriefComparisonModal').then((m) => m.BriefComparisonModal),
  { ssr: false }
);

const ApiKeyModal = dynamic(
  () => import('@/components/ApiKeyModal').then((m) => m.ApiKeyModal),
  { ssr: false }
);

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

  // Configuration state
  const [persona, setPersona] = useState<PersonaType>('ward_officer');
  const [standard, setStandard] = useState<AqiStandard>('cpcb');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>('general');
  const [showPersonaBar, setShowPersonaBar] = useState<boolean>(false);

  // API & Intelligence state
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [currentBrief, setCurrentBrief] = useState<CivicBrief | null>(null);
  const [comparison, setComparison] = useState<BriefComparison | null>(null);
  const [savedBriefs, setSavedBriefs] = useState<SavedBriefMeta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingDelta, setStreamingDelta] = useState<string>('');
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UI Modals & Drawers
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);

  // Mount guard
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch saved briefs history
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

  // Fetch live telemetry stream for city
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

  // Init local storage & default telemetry
  useEffect(() => {
    const storedKey = localStorage.getItem('civic_gemini_api_key');
    if (storedKey) setApiKey(storedKey);

    fetchSavedBriefs();
    fetchLiveTelemetry('Delhi');
  }, [fetchLiveTelemetry]);

  // Real-time SSE streaming brief synthesizer
  const handleAnalyze = useCallback(async () => {
    if (!rawData.trim()) return;
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingDelta('');
    setStreamingStatus('Initiating SSE streaming pipeline...');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        body: JSON.stringify({
          rawData,
          persona,
          standard,
          language,
          readingLevel,
          apiKey: apiKey || null,
          model: selectedModel,
          stream: true
        })
      });

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let accumulatedDelta = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';

          for (const msg of messages) {
            const lines = msg.split('\n');
            let eventType = '';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.replace('event: ', '').trim();
              } else if (line.startsWith('data: ')) {
                dataStr = line.replace('data: ', '').trim();
              }
            }

            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (eventType === 'status') {
                setStreamingStatus(parsed.message || parsed.status);
              } else if (eventType === 'delta') {
                accumulatedDelta += parsed.text;
                setStreamingDelta(accumulatedDelta);
              } else if (eventType === 'complete') {
                if (parsed.brief) {
                  setCurrentBrief(parsed.brief);
                  setComparison(parsed.comparison || null);
                } else {
                  setCurrentBrief(parsed);
                }
                fetchSavedBriefs();
              } else if (eventType === 'error') {
                setErrorMsg(parsed.error || 'Synthesis error occurred');
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      } else {
        const data = await res.json();
        if (data.success) {
          setCurrentBrief(data.brief);
          setComparison(data.comparison);
          fetchSavedBriefs();
        } else {
          setErrorMsg(data.error || 'Failed to interpret data');
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Network error processing analysis';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [rawData, persona, standard, language, readingLevel, apiKey, selectedModel]);

  // Refresh live and trigger analysis
  const handleRefreshLive = useCallback(async () => {
    const result = await fetchLiveTelemetry(currentCity);
    if (result?.csvData) {
      handleAnalyze();
    }
  }, [fetchLiveTelemetry, currentCity, handleAnalyze]);

  // Auto-analyze once initial data loads
  useEffect(() => {
    if (rawData && !currentBrief && !isLoading && !isStreaming) {
      handleAnalyze();
    }
  }, [handleAnalyze, rawData, currentBrief, isLoading, isStreaming]);

  // Handle station change contract
  const handleCityChange = useCallback((newCity: string) => {
    setCurrentCity(newCity);
    setCurrentBrief(null);
  }, []);

  // Markdown Export
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
${note.hotspotAnalysis.map((h) => `- **${h.station}** (Peak AQI: ${h.peakAQI}): ${h.likelyCauses}`).join('\n')}

### Prioritized Actions
${note.prioritizedActions.map((a) => `- **[${a.priority}] ${a.action}**\n  - Responsible: ${a.responsible}\n  - Timeframe: ${a.timeframe}\n  - Impact: ${a.impact}\n  - Grounding: ${a.groundedIn}`).join('\n')}

### Directives
${note.complianceDirectives.map((d) => `- ${d}`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.docRef}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Head>
        <title>
          {currentBrief
            ? `[AQI ${currentBrief.summary.averageAQI}] ${currentCity} Civic Air Quality Briefing Studio`
            : `Civic Air Quality Briefing Studio | ${currentCity} Telemetry`}
        </title>
      </Head>

      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-16 selection:bg-cyan-500/30 selection:text-white">
        {/* Modern High-Density Utility Header */}
        <ModernUtilityHeader
          currentStation={latestTelemetry?.station || currentCity}
          coordinates={latestTelemetry?.coordinates}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onRefreshLive={handleRefreshLive}
          isRefreshingLive={isRefreshingLive}
          onOpenHistory={() => setIsHistoryDrawerOpen(true)}
          savedBriefCount={savedBriefs.length}
          onOpenApiKey={() => setIsApiKeyModalOpen(true)}
          hasCustomKey={isMounted && !!apiKey}
        />

        <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
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
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">{errorMsg}</span>
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

          {/* Compact Persona Bar Toggle */}
          <div className="no-print">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-bold text-white uppercase text-[11px] tracking-wider">Active Persona:</span>
                <span className="text-cyan-400 font-semibold capitalize">{persona.replace('_', ' ')}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  Standard: <strong className="text-slate-200 uppercase">{standard}</strong>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  Language: <strong className="text-slate-200 uppercase">{language}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPersonaBar((prev) => !prev)}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition"
              >
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>{showPersonaBar ? 'Hide Config' : 'Configure Persona'}</span>
                {showPersonaBar ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showPersonaBar && (
              <div className="mt-2 animate-in fade-in duration-150">
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
              </div>
            )}
          </div>

          {/* Split-Screen HUD Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: High-Density Live Telemetry Studio (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <LiveTelemetryStudio
                rawData={rawData}
                setRawData={setRawData}
                onAnalyze={handleAnalyze}
                isLoading={isLoading || isStreaming}
                currentCity={currentCity}
                onCityChange={handleCityChange}
                latestTelemetry={latestTelemetry}
                onTelemetryLoaded={setLatestTelemetry}
                isRefreshingLive={isRefreshingLive}
              />
            </div>

            {/* Right Column: Streaming Civic Brief Terminal (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <StreamingBriefTerminal
                brief={currentBrief}
                isLoading={isLoading}
                isStreaming={isStreaming}
                streamingDelta={streamingDelta}
                streamingStatus={streamingStatus}
                onAnalyze={handleAnalyze}
                comparison={comparison}
                apiKey={apiKey}
                persona={persona}
                setPersona={setPersona}
                standard={standard}
                setStandard={setStandard}
                language={language}
                setLanguage={setLanguage}
                readingLevel={readingLevel}
                setReadingLevel={setReadingLevel}
                onOpenComparisonModal={() => setIsComparisonModalOpen(true)}
                onExportMarkdown={handleExportMarkdown}
                onPrint={handlePrint}
              />
            </div>
          </div>
        </main>

        {/* Global Command Palette (Cmd+K) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelectStation={(stn) => {
            fetchLiveTelemetry(stn);
          }}
          onSelectPersona={(p) => {
            setPersona(p);
            handleAnalyze();
          }}
          onRefreshLive={handleRefreshLive}
          onSynthesizeBrief={handleAnalyze}
          onExportMarkdown={handleExportMarkdown}
          onOpenHistory={() => setIsHistoryDrawerOpen(true)}
          onOpenApiKey={() => setIsApiKeyModalOpen(true)}
          currentStation={currentCity}
          currentPersona={persona}
        />

        {/* Comparison Modal */}
        <BriefComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          comparison={comparison}
        />

        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          apiKey={apiKey}
          setApiKey={(k) => {
            setApiKey(k);
            localStorage.setItem('civic_gemini_api_key', k);
          }}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />

        {/* Saved Briefs History Drawer */}
        {isHistoryDrawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-drawer-heading"
          >
            <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  <h2 id="history-drawer-heading" className="text-base font-bold text-white">
                    Briefs History
                  </h2>
                </div>
                <button
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {savedBriefs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No briefs saved yet. Generate a brief to track changes.
                  </div>
                ) : (
                  savedBriefs.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{b.personaTitle}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${b.badgeColor}`}>
                          AQI {b.averageAQI}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Peak: {b.peakLocation} ({b.peakAQI})</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(b.generatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
