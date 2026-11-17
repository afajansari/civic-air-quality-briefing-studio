'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Search,
  Clock,
  Loader2,
  MapPin,
  RefreshCw,
  Radio,
  Zap
} from 'lucide-react';
import { detectDelimiter } from '@/lib/parser';

export interface LiveCriteriaCurrent {
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  o3?: number | null;
  time?: string | null;
  [key: string]: unknown;
}

export interface LiveTelemetryData {
  city?: string;
  station?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  current?: LiveCriteriaCurrent;
  csvData?: string;
}

export interface RegionalStationGroup {
  region: string;
  stations: string[];
}

export const REGIONAL_STATIONS: RegionalStationGroup[] = [
  {
    region: 'NCR',
    stations: ['Delhi (Anand Vihar)', 'Delhi (Rohini)', 'Delhi (IGI Airport)', 'Delhi (RK Puram)']
  },
  {
    region: 'West',
    stations: ['Mumbai (Bandra)', 'Ahmedabad', 'Pune']
  },
  {
    region: 'South',
    stations: ['Bengaluru (BTM)', 'Chennai (Alandur)', 'Hyderabad (Sanathnagar)']
  },
  {
    region: 'North & East',
    stations: ['Kolkata (Victoria)', 'Lucknow', 'Kanpur', 'Patna', 'Jaipur', 'Varanasi']
  }
];

interface DataIngestionProps {
  rawData: string;
  setRawData: (data: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  currentCity?: string;
  onCityChange?: (city: string) => void;
  latestTelemetry?: LiveTelemetryData | null;
  onTelemetryLoaded?: (telemetry: LiveTelemetryData) => void;
  onSelectDataset?: (dataset: unknown) => void;
}

// CPCB criteria pollutant assessment helper
function getCpcbStatus(pollutant: string, val: number | null | undefined): { label: string; color: string; badge: string } {
  if (val == null || isNaN(val)) {
    return { label: 'Pending', color: 'text-slate-400', badge: 'bg-slate-800/80 text-slate-400 border-slate-700' };
  }

  if (pollutant === 'PM2.5') {
    if (val <= 30) return { label: 'Good', color: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (val <= 60) return { label: 'Satisfactory', color: 'text-teal-400', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    if (val <= 90) return { label: 'Moderate', color: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    if (val <= 120) return { label: 'Poor', color: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
    if (val <= 250) return { label: 'Very Poor', color: 'text-rose-400', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
    return { label: 'Severe', color: 'text-purple-400', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
  }

  if (pollutant === 'PM10') {
    if (val <= 50) return { label: 'Good', color: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (val <= 100) return { label: 'Satisfactory', color: 'text-teal-400', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    if (val <= 250) return { label: 'Moderate', color: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    if (val <= 350) return { label: 'Poor', color: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
    if (val <= 430) return { label: 'Very Poor', color: 'text-rose-400', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
    return { label: 'Severe', color: 'text-purple-400', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
  }

  if (pollutant === 'NO2') {
    if (val <= 40) return { label: 'Good', color: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (val <= 80) return { label: 'Satisfactory', color: 'text-teal-400', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    if (val <= 180) return { label: 'Moderate', color: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    if (val <= 280) return { label: 'Poor', color: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
    return { label: 'Very Poor', color: 'text-rose-400', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
  }

  if (pollutant === 'SO2') {
    if (val <= 40) return { label: 'Good', color: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (val <= 80) return { label: 'Satisfactory', color: 'text-teal-400', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    if (val <= 380) return { label: 'Moderate', color: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    return { label: 'High', color: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
  }

  if (pollutant === 'CO') {
    // Standard CO in mg/m³
    const norm = val > 100 ? val / 1000 : val;
    if (norm <= 1.0) return { label: 'Good', color: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (norm <= 2.0) return { label: 'Satisfactory', color: 'text-teal-400', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    if (norm <= 10.0) return { label: 'Moderate', color: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    return { label: 'Elevated', color: 'text-rose-400', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
  }

  if (pollutant === 'O3') {
    if (val <= 50) return { label: 'Good', color: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (val <= 100) return { label: 'Satisfactory', color: 'text-teal-400', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    if (val <= 168) return { label: 'Moderate', color: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    return { label: 'Elevated', color: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
  }

  return { label: 'Normal', color: 'text-cyan-400', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
}

function formatObservedTime(timeStr?: string | null): string {
  if (!timeStr) return 'Latest Synchronized';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  } catch {
    return timeStr;
  }
}

export const DataIngestion: React.FC<DataIngestionProps> = ({
  rawData,
  setRawData,
  onAnalyze,
  isLoading,
  currentCity = 'Delhi',
  onCityChange,
  latestTelemetry,
  onTelemetryLoaded
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'paste' | 'upload'>('live');
  const [detectedFormat, setDetectedFormat] = useState<string>('CSV');
  const [searchCity, setSearchCity] = useState<string>('');
  const [selectedStation, setSelectedStation] = useState<string>(currentCity);
  const [liveLoading, setLiveLoading] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [internalTelemetry, setInternalTelemetry] = useState<LiveTelemetryData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selectedStation when currentCity prop changes
  useEffect(() => {
    if (currentCity) {
      setSelectedStation(currentCity);
    }
  }, [currentCity]);

  // Combined active telemetry
  const activeTelemetry = latestTelemetry || internalTelemetry;

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

  const handleFetchCityTelemetry = useCallback(
    async (cityName: string) => {
      if (!cityName.trim()) return;
      setLiveLoading(true);
      setLiveError(null);
      setSelectedStation(cityName);
      onCityChange?.(cityName);

      try {
        const res = await fetch(`/api/live-aqi?city=${encodeURIComponent(cityName.trim())}`);
        const data = await res.json();
        if (data.success && data.csvData) {
          setRawData(data.csvData);
          const telemetryRecord: LiveTelemetryData = {
            city: data.city || cityName,
            station: data.station || cityName,
            coordinates: data.coordinates,
            current: data.current || {},
            csvData: data.csvData
          };
          setInternalTelemetry(telemetryRecord);
          onTelemetryLoaded?.(telemetryRecord);
        } else {
          setLiveError(data.error || `Unable to fetch live telemetry for "${cityName}".`);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Network error querying Open-Meteo & CPCB live grid';
        setLiveError(message);
      } finally {
        setLiveLoading(false);
      }
    },
    [onCityChange, onTelemetryLoaded, setRawData]
  );

  return (
    <section aria-labelledby="data-ingestion-heading" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 id="data-ingestion-heading" className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Air Quality Data Ingestion
          </h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry from CPCB/Open-Meteo sensors, municipal logs, or handheld IoT logs
          </p>
        </div>

        {/* Accessible Tab Switcher */}
        <div role="tablist" aria-label="Air Quality Ingestion Sources" className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            role="tab"
            id="tab-live"
            aria-selected={activeTab === 'live'}
            aria-controls="panel-live"
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              activeTab === 'live'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Live India AQI Network</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" aria-hidden="true" />
          </button>
          <button
            role="tab"
            id="tab-paste"
            aria-selected={activeTab === 'paste'}
            aria-controls="panel-paste"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              activeTab === 'paste'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
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
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            Upload File
          </button>
        </div>
      </div>

      {/* Tab 1: Live India AQI Network (Hero & Default Tab) */}
      {activeTab === 'live' && (
        <div id="panel-live" role="tabpanel" aria-labelledby="tab-live" className="space-y-4">
          {/* Pulsing Live Telemetry Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
                  <span>LIVE TELEMETRY • Open-Meteo &amp; CPCB Grid</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    REAL-TIME
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Synchronized hourly telemetry for criteria pollutants from CAAQMS &amp; High-Resolution Copernicus ECMWF model
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleFetchCityTelemetry(selectedStation || 'Delhi')}
                disabled={liveLoading}
                aria-label={`Refresh live telemetry for ${selectedStation || 'current station'}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-emerald-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${liveLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>{liveLoading ? 'Updating Grid...' : 'Re-fetch Station'}</span>
              </button>
            </div>
          </div>

          {/* Regional Station Quick-Select Chips */}
          <div className="space-y-2.5 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                Key Indian Regional CAAQMS Stations:
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Click any station to load instantaneous data</span>
            </div>

            <div className="space-y-2 pt-1">
              {REGIONAL_STATIONS.map((group) => (
                <div key={group.region} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:w-28 shrink-0">
                    {group.region}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.stations.map((stn) => {
                      const isCurrent =
                        selectedStation.toLowerCase() === stn.toLowerCase() ||
                        (selectedStation.toLowerCase() === 'delhi' && stn === 'Delhi (Anand Vihar)');
                      return (
                        <button
                          key={stn}
                          type="button"
                          onClick={() => handleFetchCityTelemetry(stn)}
                          disabled={liveLoading}
                          aria-pressed={isCurrent}
                          aria-label={`Load live CAAQMS data for ${stn}`}
                          className={`px-2.5 py-1 text-xs rounded-lg border transition flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isCurrent
                              ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm shadow-emerald-500/20'
                              : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" aria-hidden="true" />}
                          <span>{stn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (liveLoading || !searchCity.trim()) return;
                handleFetchCityTelemetry(searchCity.trim());
              }}
              aria-busy={liveLoading}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-slate-800"
            >
              <div className="relative flex-1">
                {liveLoading ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                ) : (
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                )}
                <input
                  type="text"
                  id="city-search-input"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  disabled={liveLoading}
                  placeholder="Type any Indian city, ward, or district (e.g. Noida, Gurgaon, Surat, Bhopal, Chandigarh)..."
                  aria-label="Search Indian city, ward, or district"
                  className="w-full bg-slate-900 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400 disabled:bg-slate-800 disabled:text-slate-400 disabled:border-slate-700 disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={liveLoading || !searchCity.trim()}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-400 disabled:border-slate-700 disabled:cursor-not-allowed border border-transparent text-slate-950 font-bold text-xs rounded-xl transition focus:outline-none focus:ring-2 focus:ring-emerald-400 shrink-0"
              >
                {liveLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Querying Open-Meteo...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Fetch Live Telemetry</span>
                  </>
                )}
              </button>
            </form>

            {/* Live Search & Telemetry Status Announcement for Screen Readers */}
            <div aria-live="polite" className="sr-only">
              {liveLoading
                ? `Querying live telemetry for ${searchCity || selectedStation}...`
                : activeTelemetry?.current
                ? `Live telemetry loaded for ${activeTelemetry.station || activeTelemetry.city || selectedStation}.`
                : ''}
            </div>
          </div>

          {/* Error Notice */}
          {liveError && (
            <div role="alert" className="text-xs text-rose-300 bg-rose-950/50 p-3 rounded-xl border border-rose-800/80 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
              <span>{liveError}</span>
            </div>
          )}

          {/* Clean Summary Card of Latest Live Criteria Readings */}
          {activeTelemetry?.current && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span className="text-xs font-bold text-white">
                    {activeTelemetry.station || activeTelemetry.city || selectedStation} Telemetry Overview
                  </span>
                  {activeTelemetry.coordinates && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({activeTelemetry.coordinates.lat?.toFixed(2)}°N, {activeTelemetry.coordinates.lon?.toFixed(2)}°E)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>
                    Observed: <strong className="text-slate-300 font-mono">{formatObservedTime(activeTelemetry.current.time)}</strong>
                  </span>
                </div>
              </div>

              {/* 6 Criteria Pollutants Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {[
                  {
                    code: 'PM2.5',
                    name: 'Fine Particles',
                    val: activeTelemetry.current.pm25,
                    unit: 'µg/m³',
                    ref: 'CPCB: 60'
                  },
                  {
                    code: 'PM10',
                    name: 'Respirable Dust',
                    val: activeTelemetry.current.pm10,
                    unit: 'µg/m³',
                    ref: 'CPCB: 100'
                  },
                  {
                    code: 'NO2',
                    name: 'Nitrogen Dioxide',
                    val: activeTelemetry.current.no2,
                    unit: 'µg/m³',
                    ref: 'CPCB: 80'
                  },
                  {
                    code: 'SO2',
                    name: 'Sulphur Dioxide',
                    val: activeTelemetry.current.so2,
                    unit: 'µg/m³',
                    ref: 'CPCB: 80'
                  },
                  {
                    code: 'CO',
                    name: 'Carbon Monoxide',
                    val:
                      activeTelemetry.current.co != null
                        ? activeTelemetry.current.co > 100
                          ? Math.round((activeTelemetry.current.co / 1000) * 100) / 100
                          : activeTelemetry.current.co
                        : null,
                    unit: activeTelemetry.current.co != null && activeTelemetry.current.co > 100 ? 'mg/m³' : 'mg/m³',
                    ref: 'CPCB: 2.0'
                  },
                  {
                    code: 'O3',
                    name: 'Surface Ozone',
                    val: activeTelemetry.current.o3,
                    unit: 'µg/m³',
                    ref: 'CPCB: 100'
                  }
                ].map((item) => {
                  const status = getCpcbStatus(item.code, item.val);
                  const displayVal = item.val != null ? (Math.round(Number(item.val) * 10) / 10).toFixed(1) : '—';
                  return (
                    <div
                      key={item.code}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-extrabold text-white">{item.code}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${status.badge}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 my-1">
                        <span className={`text-lg font-mono font-black ${status.color}`}>{displayVal}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.unit}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="truncate max-w-[70px]">{item.name}</span>
                        <span className="text-slate-400 font-mono text-[9px]">{item.ref}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
                <span className="text-slate-400">|</span>
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
          <p className="text-sm font-semibold text-white">Click or drag &amp; drop sensor log file</p>
          <p className="text-xs text-slate-400 mt-1">Supports CSV, TSV, JSON, and raw handheld/IoT text logs</p>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400" aria-live="polite">
          {rawData ? (
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Live CAAQMS telemetry loaded and ready for AI interpretation
            </span>
          ) : (
            <span>Select an Indian station or paste readings above to begin</span>
          )}
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={!rawData || isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-400 disabled:border-slate-700 disabled:cursor-not-allowed transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <Sparkles className="w-4 h-4 text-slate-950" aria-hidden="true" />
          {isLoading ? 'Interpreting Data with AI...' : 'Generate Civic Intelligence Brief'}
        </button>
      </div>
    </section>
  );
};
