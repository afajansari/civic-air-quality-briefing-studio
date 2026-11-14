'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Database, Globe, AlertTriangle, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { AUTHENTIC_DATASETS, DatasetPreset } from '@/lib/authentic-datasets';
import { detectDelimiter } from '@/lib/parser';

interface DataIngestionProps {
  rawData: string;
  setRawData: (data: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  onSelectDataset: (dataset: DatasetPreset) => void;
}

export const DataIngestion: React.FC<DataIngestionProps> = ({
  rawData,
  setRawData,
  onAnalyze,
  isLoading,
  onSelectDataset
}) => {
  const [activeTab, setActiveTab] = useState<'datasets' | 'paste' | 'upload' | 'live'>('datasets');
  const [detectedFormat, setDetectedFormat] = useState<string>('CSV');
  const [liveCity, setLiveCity] = useState<string>('Delhi');
  const [liveLoading, setLiveLoading] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (rawData) {
      if (rawData.trim().startsWith('{') || rawData.trim().startsWith('[')) {
        setDetectedFormat('JSON');
      } else {
        const delim = detectDelimiter(rawData);
        if (delim === '\t') setDetectedFormat('TSV (Tab-Delimited)');
        else if (delim === ';') setDetectedFormat('Semicolon-Delimited (European CSV)');
        else if (delim === '|') setDetectedFormat('Pipe-Delimited (|)');
        else setDetectedFormat('Comma-Separated (CSV)');
      }
    }
  }, [rawData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setRawData(content);
          setActiveTab('paste');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFetchLiveOpenAQ = async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const res = await fetch(`/api/openaq?city=${encodeURIComponent(liveCity)}`);
      const data = await res.json();
      if (data.success && data.csvData) {
        setRawData(data.csvData);
        setActiveTab('paste');
      } else {
        setLiveError(data.error || 'Failed to fetch live data');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Network error fetching OpenAQ data';
      setLiveError(message);
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <section aria-labelledby="data-ingestion-heading" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 id="data-ingestion-heading" className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Air Quality Data Ingestion
          </h2>
          <p className="text-xs text-slate-400">
            Accepts messy tabular logs, mixed units, missing values, or live official stations
          </p>
        </div>

        {/* Accessible Tab Switcher */}
        <div role="tablist" aria-label="Data Ingestion Methods" className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            role="tab"
            id="tab-datasets"
            aria-selected={activeTab === 'datasets'}
            aria-controls="panel-datasets"
            onClick={() => setActiveTab('datasets')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              activeTab === 'datasets'
                ? 'bg-emerald-500 text-slate-950 shadow font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" aria-hidden="true" />
            Curated Real Data
          </button>
          <button
            role="tab"
            id="tab-paste"
            aria-selected={activeTab === 'paste'}
            aria-controls="panel-paste"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              activeTab === 'paste'
                ? 'bg-emerald-500 text-slate-950 shadow font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            Paste Messy Data
          </button>
          <button
            role="tab"
            id="tab-upload"
            aria-selected={activeTab === 'upload'}
            aria-controls="panel-upload"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              activeTab === 'upload'
                ? 'bg-emerald-500 text-slate-950 shadow font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            Upload File
          </button>
          <button
            role="tab"
            id="tab-live"
            aria-selected={activeTab === 'live'}
            aria-controls="panel-live"
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              activeTab === 'live'
                ? 'bg-emerald-500 text-slate-950 shadow font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            Live OpenAQ Feed
          </button>
        </div>
      </div>

      {/* Tab 1: Curated Real Datasets */}
      {activeTab === 'datasets' && (
        <div id="panel-datasets" role="tabpanel" aria-labelledby="tab-datasets" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AUTHENTIC_DATASETS.map((ds) => (
              <div
                key={ds.id}
                role="button"
                tabIndex={0}
                aria-label={`Select dataset: ${ds.name} from ${ds.location}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectDataset(ds);
                    setRawData(ds.csvData);
                  }
                }}
                onClick={() => {
                  onSelectDataset(ds);
                  setRawData(ds.csvData);
                }}
                className="group p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-emerald-500/50 cursor-pointer transition flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition line-clamp-1">
                      {ds.name}
                    </h3>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 shrink-0">
                      {ds.location}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                    {ds.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-900 text-slate-400">
                  <span className="truncate max-w-[200px]">Source: {ds.source.split('(')[0]}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    Load Dataset <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Paste Raw / Messy Data */}
      {activeTab === 'paste' && (
        <div id="panel-paste" role="tabpanel" aria-labelledby="tab-paste" className="space-y-3">
          <label htmlFor="raw-data-textarea" className="sr-only">
            Paste raw tabular air quality data
          </label>
          <div className="relative">
            <textarea
              id="raw-data-textarea"
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="Paste raw tabular data here (CSV, TSV, semi-colon, JSON, or copy-pasted Excel cells with headers)..."
              rows={6}
              className="w-full bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-y"
            />
            {rawData && (
              <div className="absolute right-3 bottom-3 flex items-center gap-2 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] text-slate-300 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                <span>Detected: {detectedFormat}</span>
                <span className="text-slate-500">|</span>
                <span>{rawData.trim().split('\n').length} lines</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Upload File */}
      {activeTab === 'upload' && (
        <div
          id="panel-upload"
          role="tabpanel"
          aria-labelledby="tab-upload"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={0}
          aria-label="Click or press enter to upload air quality log file"
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer transition bg-slate-950/40 hover:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <input
            type="file"
            id="file-upload-input"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.tsv,.json,.txt"
            className="hidden"
            aria-label="Upload raw sensor log file"
          />
          <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-semibold text-white">Click or drag & drop sensor log file</p>
          <p className="text-xs text-slate-400 mt-1">Supports CSV, TSV, JSON, and raw text logs</p>
        </div>
      )}

      {/* Tab 4: Live OpenAQ Feed */}
      {activeTab === 'live' && (
        <div id="panel-live" role="tabpanel" aria-labelledby="tab-live" className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="city-input" className="text-xs text-slate-300">
              City:
            </label>
            {['Delhi', 'London', 'Los Angeles', 'Paris', 'Tokyo'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setLiveCity(c)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  liveCity === c
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-medium'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
            <input
              id="city-input"
              type="text"
              value={liveCity}
              onChange={(e) => setLiveCity(e.target.value)}
              placeholder="Or type city name..."
              className="bg-slate-900 text-xs text-white px-3 py-1 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleFetchLiveOpenAQ}
              disabled={liveLoading}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition ml-auto focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {liveLoading ? 'Querying OpenAQ API...' : 'Fetch Live Sensor Data'}
            </button>
          </div>

          {liveError && (
            <div role="alert" className="text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/60 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
              <span>{liveError}</span>
            </div>
          )}
        </div>
      )}

      {/* Primary Action Button */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
        <div className="text-xs text-slate-400" aria-live="polite">
          {rawData ? (
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Data loaded and ready for AI interpretation
            </span>
          ) : (
            <span>Select a dataset or paste readings above to begin</span>
          )}
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={!rawData || isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <Sparkles className="w-4 h-4 text-slate-950" aria-hidden="true" />
          {isLoading ? 'Interpreting Data with AI...' : 'Generate Civic Intelligence Brief'}
        </button>
      </div>
    </section>
  );
};
