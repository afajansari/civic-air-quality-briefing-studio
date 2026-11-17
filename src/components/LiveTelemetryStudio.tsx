'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Activity,
  Search,
  Loader2,
  MapPin,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Upload,
  Layers,
  Database,
  Radio
} from 'lucide-react';
import { detectDelimiter } from '@/lib/parser';
import { INDIAN_DATASETS } from '@/lib/authentic-datasets';
import { LiveTelemetryData } from '@/components/DataIngestion';

export interface RegionalGroup {
  region: string;
  stations: string[];
}

export const REGIONAL_GROUPS: RegionalGroup[] = [
  {
    region: 'NCR',
    stations: ['Delhi (Anand Vihar)', 'Delhi (Rohini)', 'Delhi (IGI Airport)', 'Delhi (RK Puram)']
  },
  {
    region: 'West',
    stations: ['Mumbai (Bandra)', 'Mumbai (Colaba)', 'Ahmedabad', 'Pune']
  },
  {
    region: 'South',
    stations: ['Bengaluru (BTM)', 'Chennai (Alandur)', 'Hyderabad (Sanathnagar)']
  },
  {
    region: 'North & East',
    stations: ['Kolkata (Victoria)', 'Lucknow', 'Patna', 'Jaipur', 'Kanpur', 'Varanasi']
  }
];

export interface PollutantStatus {
  label: string;
  color: string;
  chipClass: string;
  borderClass: string;
  pct: number;
}

// CPCB criteria pollutant assessment helper
export function getCpcbPollutantStatus(pollutant: string, val: number | null | undefined): PollutantStatus {
  if (val == null || isNaN(val)) {
    return {
      label: 'Pending',
      color: 'text-slate-400',
      chipClass: 'bg-slate-800 text-slate-400 border-slate-700',
      borderClass: 'border-slate-800',
      pct: 0
    };
  }

  if (pollutant === 'PM2.5') {
    // 0-30 Good, 31-60 Satisfactory, 61-90 Moderate, 91-120 Poor, 121-250 Very Poor, >250 Severe
    const pct = Math.min(100, Math.round((val / 300) * 100));
    if (val <= 30) return { label: 'Good', color: 'text-emerald-400', chipClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', borderClass: 'border-emerald-500/30', pct };
    if (val <= 60) return { label: 'Satisfactory', color: 'text-teal-400', chipClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30', borderClass: 'border-teal-500/30', pct };
    if (val <= 90) return { label: 'Moderate', color: 'text-amber-400', chipClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30', borderClass: 'border-amber-500/30', pct };
    if (val <= 120) return { label: 'Poor', color: 'text-orange-400', chipClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30', borderClass: 'border-orange-500/30', pct };
    if (val <= 250) return { label: 'Very Poor', color: 'text-rose-400', chipClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30', borderClass: 'border-rose-500/30', pct };
    return { label: 'Severe', color: 'text-purple-400', chipClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30', borderClass: 'border-purple-500/30', pct };
  }

  if (pollutant === 'PM10') {
    // 0-50 Good, 51-100 Satisfactory, 101-250 Moderate, 251-350 Poor, 351-430 Very Poor, >430 Severe
    const pct = Math.min(100, Math.round((val / 500) * 100));
    if (val <= 50) return { label: 'Good', color: 'text-emerald-400', chipClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', borderClass: 'border-emerald-500/30', pct };
    if (val <= 100) return { label: 'Satisfactory', color: 'text-teal-400', chipClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30', borderClass: 'border-teal-500/30', pct };
    if (val <= 250) return { label: 'Moderate', color: 'text-amber-400', chipClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30', borderClass: 'border-amber-500/30', pct };
    if (val <= 350) return { label: 'Poor', color: 'text-orange-400', chipClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30', borderClass: 'border-orange-500/30', pct };
    if (val <= 430) return { label: 'Very Poor', color: 'text-rose-400', chipClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30', borderClass: 'border-rose-500/30', pct };
    return { label: 'Severe', color: 'text-purple-400', chipClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30', borderClass: 'border-purple-500/30', pct };
  }

  if (pollutant === 'NO2') {
    const pct = Math.min(100, Math.round((val / 200) * 100));
    if (val <= 40) return { label: 'Good', color: 'text-emerald-400', chipClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', borderClass: 'border-emerald-500/30', pct };
    if (val <= 80) return { label: 'Satisfactory', color: 'text-teal-400', chipClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30', borderClass: 'border-teal-500/30', pct };
    if (val <= 180) return { label: 'Moderate', color: 'text-amber-400', chipClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30', borderClass: 'border-amber-500/30', pct };
    if (val <= 280) return { label: 'Poor', color: 'text-orange-400', chipClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30', borderClass: 'border-orange-500/30', pct };
    if (val <= 400) return { label: 'Very Poor', color: 'text-rose-400', chipClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30', borderClass: 'border-rose-500/30', pct };
    return { label: 'Severe', color: 'text-purple-400', chipClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30', borderClass: 'border-purple-500/30', pct };
  }

  if (pollutant === 'SO2') {
    const pct = Math.min(100, Math.round((val / 200) * 100));
    if (val <= 40) return { label: 'Good', color: 'text-emerald-400', chipClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', borderClass: 'border-emerald-500/30', pct };
    if (val <= 80) return { label: 'Satisfactory', color: 'text-teal-400', chipClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30', borderClass: 'border-teal-500/30', pct };
    if (val <= 380) return { label: 'Moderate', color: 'text-amber-400', chipClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30', borderClass: 'border-amber-500/30', pct };
    if (val <= 800) return { label: 'Poor', color: 'text-orange-400', chipClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30', borderClass: 'border-orange-500/30', pct };
    return { label: 'Very Poor', color: 'text-rose-400', chipClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30', borderClass: 'border-rose-500/30', pct };
  }

  if (pollutant === 'CO') {
    const pct = Math.min(100, Math.round((val / 10) * 100));
    if (val <= 1.0) return { label: 'Good', color: 'text-emerald-400', chipClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', borderClass: 'border-emerald-500/30', pct };
    if (val <= 2.0) return { label: 'Satisfactory', color: 'text-teal-400', chipClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30', borderClass: 'border-teal-500/30', pct };
    if (val <= 10.0) return { label: 'Moderate', color: 'text-amber-400', chipClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30', borderClass: 'border-amber-500/30', pct };
    if (val <= 17.0) return { label: 'Poor', color: 'text-orange-400', chipClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30', borderClass: 'border-orange-500/30', pct };
    return { label: 'Very Poor', color: 'text-rose-400', chipClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30', borderClass: 'border-rose-500/30', pct };
  }

  if (pollutant === 'O3') {
    const pct = Math.min(100, Math.round((val / 200) * 100));
    if (val <= 50) return { label: 'Good', color: 'text-emerald-400', chipClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', borderClass: 'border-emerald-500/30', pct };
    if (val <= 100) return { label: 'Satisfactory', color: 'text-teal-400', chipClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30', borderClass: 'border-teal-500/30', pct };
    if (val <= 168) return { label: 'Moderate', color: 'text-amber-400', chipClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30', borderClass: 'border-amber-500/30', pct };
    if (val <= 208) return { label: 'Poor', color: 'text-orange-400', chipClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30', borderClass: 'border-orange-500/30', pct };
    return { label: 'Very Poor', color: 'text-rose-400', chipClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30', borderClass: 'border-rose-500/30', pct };
  }

  return { label: 'Moderate', color: 'text-amber-400', chipClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30', borderClass: 'border-amber-500/30', pct: 50 };
}

// Mini SVG Sparkline Component
function DiurnalSparkline({
  data,
  color,
  gradientId,
  label,
  unit,
  currentVal
}: {
  data: number[];
  color: string;
  gradientId: string;
  label: string;
  unit: string;
  currentVal: number | null | undefined;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center text-slate-500 text-[10px] font-mono">
        No diurnal time-series available
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 280;
  const height = 56;
  const pad = 4;

  const points = data.map((val, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((val - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          {label} 24-hr Diurnal Trend
        </span>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span>Min: <strong className="text-slate-200">{min.toFixed(0)}</strong></span>
          <span>Max: <strong className="text-rose-400">{max.toFixed(0)}</strong></span>
          <span className="text-slate-200 font-bold bg-slate-800 px-1.5 py-0.2 rounded">
            Now: {currentVal != null ? `${currentVal} ${unit}` : 'N/A'}
          </span>
        </div>
      </div>
      <div className="relative h-14 w-full bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-hidden p-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gradientId})`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="3.5"
              fill={color}
              className="animate-pulse"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

interface LiveTelemetryStudioProps {
  rawData: string;
  setRawData: (data: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  currentCity: string;
  onCityChange: (city: string) => void;
  latestTelemetry?: LiveTelemetryData | null;
  onTelemetryLoaded?: (telemetry: LiveTelemetryData) => void;
  isRefreshingLive?: boolean;
}

export const LiveTelemetryStudio: React.FC<LiveTelemetryStudioProps> = ({
  rawData,
  setRawData,
  onAnalyze,
  isLoading,
  currentCity,
  onCityChange,
  latestTelemetry,
  onTelemetryLoaded,
  isRefreshingLive
}) => {
  const [searchCity, setSearchCity] = useState('');
  const [liveLoading, setLiveLoading] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>('NCR');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse diurnal 24-hr values from rawData CSV
  const { pm25Diurnal, pm10Diurnal } = useMemo(() => {
    const pm25List: number[] = [];
    const pm10List: number[] = [];
    if (!rawData) return { pm25Diurnal: pm25List, pm10Diurnal: pm10List };

    const lines = rawData.trim().split(/\r?\n/);
    if (lines.length <= 1) return { pm25Diurnal: pm25List, pm10Diurnal: pm10List };

    // Find indices
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const pm25Idx = headers.findIndex((h) => h.includes('pm2.5') || h.includes('pm25') || h.includes('pm2_5'));
    const pm10Idx = headers.findIndex((h) => h.includes('pm10') || h.includes('pm_10'));

    for (let i = 1; i < lines.length && i <= 25; i++) {
      const parts = lines[i].split(',');
      if (pm25Idx !== -1 && parts[pm25Idx]) {
        const val = parseFloat(parts[pm25Idx]);
        if (!isNaN(val)) pm25List.push(val);
      }
      if (pm10Idx !== -1 && parts[pm10Idx]) {
        const val = parseFloat(parts[pm10Idx]);
        if (!isNaN(val)) pm10List.push(val);
      }
    }

    return { pm25Diurnal: pm25List, pm10Diurnal: pm10List };
  }, [rawData]);

  // Current criteria pollutant readings from telemetry
  const current = latestTelemetry?.current || {};
  const currentPM25 = current.pm25 != null ? current.pm25 : null;
  const currentPM10 = current.pm10 != null ? current.pm10 : null;
  const currentNO2 = current.no2 != null ? current.no2 : null;
  const currentSO2 = current.so2 != null ? current.so2 : null;
  const currentCO = current.co != null ? current.co : null;
  const currentO3 = current.o3 != null ? current.o3 : null;

  // Station resolution and query
  const handleQueryCity = useCallback(
    async (cityName: string) => {
      if (!cityName.trim() || liveLoading) return;
      setLiveLoading(true);
      setSearchStatus(`Resolving telemetry stream for ${cityName}...`);

      try {
        const res = await fetch(`/api/live-aqi?city=${encodeURIComponent(cityName)}`);
        const data = await res.json();
        if (data.success && data.csvData) {
          setRawData(data.csvData);
          onCityChange(data.city || cityName);
          const telemetry: LiveTelemetryData = {
            city: data.city || cityName,
            station: data.station || cityName,
            coordinates: data.coordinates,
            current: data.current || {},
            csvData: data.csvData
          };
          if (onTelemetryLoaded) {
            onTelemetryLoaded(telemetry);
          }
          setSearchStatus(`Connected to ${data.station || cityName} successfully`);
        } else {
          setSearchStatus(`Station lookup failed: ${data.error || 'Unknown error'}`);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Telemetry network error';
        setSearchStatus(`Network error: ${msg}`);
      } finally {
        setLiveLoading(false);
      }
    },
    [liveLoading, onCityChange, onTelemetryLoaded, setRawData]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (liveLoading || !searchCity.trim()) return;
    const q = searchCity.trim();
    handleQueryCity(q);
    setSearchCity('');
  };

  // Upload custom log file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setRawData(content);
        setIsInspectorOpen(true);
      }
    };
    reader.readAsText(file);
  };

  // Delimiter and line inspection
  const delimiter = useMemo(() => detectDelimiter(rawData), [rawData]);
  const rowCount = useMemo(() => {
    if (!rawData) return 0;
    return rawData.trim().split(/\r?\n/).length - 1;
  }, [rawData]);

  const selectedStation = currentCity;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col space-y-4 p-4 sm:p-5">
      {/* Studio Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400" aria-hidden="true">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <h2 className="text-sm font-black tracking-tight text-white uppercase">
              Live Telemetry Studio
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              CPCB CAAQMS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time urban atmospheric criteria pollutant telemetry & 24-hr diurnal profiles
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRefreshingLive && (
            <span className="text-[10px] font-mono text-emerald-400 animate-pulse flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Syncing...
            </span>
          )}
          {latestTelemetry?.station && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {latestTelemetry.station}
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isLoading}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition disabled:opacity-50"
            title="Trigger AI civic intelligence synthesis"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            <span>Synthesize</span>
          </button>
        </div>
      </div>

      {/* Instant City Search Form */}
      <form
        onSubmit={handleFormSubmit}
        aria-busy={liveLoading}
        className="relative flex items-center gap-2"
      >
        <span aria-live="polite" className="sr-only">
          {searchStatus || (liveLoading ? 'Loading telemetry...' : 'Ready')}
        </span>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            disabled={liveLoading}
            placeholder="Search any Indian city, town or CAAQMS station (Press Enter)..."
            className="w-full bg-slate-950 text-xs text-slate-100 pl-9 pr-10 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-400 disabled:bg-slate-800 disabled:text-slate-400 disabled:border-slate-700 transition"
          />
          {liveLoading ? (
            <div className="absolute right-3 top-2.5">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" aria-hidden="true" />
            </div>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-3 top-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-800 border border-slate-700 rounded">
              ↵
            </kbd>
          )}
        </div>

        <button
          type="submit"
          disabled={liveLoading || !searchCity.trim()}
          className="px-3 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-bold text-slate-950 transition focus:outline-none focus:ring-2 focus:ring-cyan-400 shrink-0"
        >
          {liveLoading ? 'Connecting...' : 'Query'}
        </button>
      </form>

      {/* Categorized Regional Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Regional CAAQMS Grids
          </span>
          <div className="flex items-center gap-1">
            {REGIONAL_GROUPS.map((rg) => (
              <button
                key={rg.region}
                type="button"
                onClick={() => setActiveRegion(rg.region)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  activeRegion === rg.region
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {rg.region}
              </button>
            ))}
          </div>
        </div>

        {/* Station Chips for Active Region */}
        <div className="flex flex-wrap gap-1.5">
          {REGIONAL_GROUPS.find((rg) => rg.region === activeRegion)?.stations.map((stn) => {
            const isMatch =
              selectedStation.toLowerCase() === stn.toLowerCase() ||
              (selectedStation.toLowerCase() === 'delhi' && stn === 'Delhi (Anand Vihar)');

            return (
              <button
                key={stn}
                type="button"
                onClick={() => {
                  onCityChange(stn);
                  handleQueryCity(stn);
                }}
                disabled={liveLoading}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                  isMatch
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <MapPin className={`w-3 h-3 ${isMatch ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{stn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prominent Criteria Pollutant Cards / Gauges */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            CPCB Criteria Pollutants (Ambient Ingestion)
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {latestTelemetry?.current?.time ? `Updated ${latestTelemetry.current.time}` : 'Live Telemetry'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* 1. PM2.5 */}
          {(() => {
            const status = getCpcbPollutantStatus('PM2.5', currentPM25);
            return (
              <div className={`p-3 rounded-xl bg-slate-950/80 border ${status.borderClass} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">PM2.5</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${status.chipClass}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black ${status.color}`}>
                    {currentPM25 != null ? currentPM25 : '—'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">µg/m³</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status.label === 'Good'
                        ? 'bg-emerald-400'
                        : status.label === 'Moderate'
                        ? 'bg-amber-400'
                        : status.label === 'Poor'
                        ? 'bg-orange-400'
                        : status.label === 'Very Poor'
                        ? 'bg-rose-400'
                        : 'bg-purple-400'
                    }`}
                    style={{ width: `${status.pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* 2. PM10 */}
          {(() => {
            const status = getCpcbPollutantStatus('PM10', currentPM10);
            return (
              <div className={`p-3 rounded-xl bg-slate-950/80 border ${status.borderClass} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">PM10</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${status.chipClass}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black ${status.color}`}>
                    {currentPM10 != null ? currentPM10 : '—'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">µg/m³</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status.label === 'Good'
                        ? 'bg-emerald-400'
                        : status.label === 'Moderate'
                        ? 'bg-amber-400'
                        : status.label === 'Poor'
                        ? 'bg-orange-400'
                        : status.label === 'Very Poor'
                        ? 'bg-rose-400'
                        : 'bg-purple-400'
                    }`}
                    style={{ width: `${status.pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* 3. NO2 */}
          {(() => {
            const status = getCpcbPollutantStatus('NO2', currentNO2);
            return (
              <div className={`p-3 rounded-xl bg-slate-950/80 border ${status.borderClass} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">NO2</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${status.chipClass}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black ${status.color}`}>
                    {currentNO2 != null ? currentNO2 : '—'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">µg/m³</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status.label === 'Good'
                        ? 'bg-emerald-400'
                        : status.label === 'Moderate'
                        ? 'bg-amber-400'
                        : status.label === 'Poor'
                        ? 'bg-orange-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${status.pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* 4. SO2 */}
          {(() => {
            const status = getCpcbPollutantStatus('SO2', currentSO2);
            return (
              <div className={`p-3 rounded-xl bg-slate-950/80 border ${status.borderClass} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">SO2</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${status.chipClass}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black ${status.color}`}>
                    {currentSO2 != null ? currentSO2 : '—'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">µg/m³</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status.label === 'Good'
                        ? 'bg-emerald-400'
                        : status.label === 'Moderate'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${status.pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* 5. CO */}
          {(() => {
            const status = getCpcbPollutantStatus('CO', currentCO);
            return (
              <div className={`p-3 rounded-xl bg-slate-950/80 border ${status.borderClass} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">CO</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${status.chipClass}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black ${status.color}`}>
                    {currentCO != null ? currentCO : '—'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">mg/m³</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status.label === 'Good'
                        ? 'bg-emerald-400'
                        : status.label === 'Moderate'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${status.pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* 6. O3 */}
          {(() => {
            const status = getCpcbPollutantStatus('O3', currentO3);
            return (
              <div className={`p-3 rounded-xl bg-slate-950/80 border ${status.borderClass} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">O3</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${status.chipClass}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black ${status.color}`}>
                    {currentO3 != null ? currentO3 : '—'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">µg/m³</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status.label === 'Good'
                        ? 'bg-emerald-400'
                        : status.label === 'Moderate'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${status.pct}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Mini 24-hr Diurnal Sparklines for PM2.5 and PM10 */}
      <div className="space-y-3 pt-1">
        <DiurnalSparkline
          data={pm25Diurnal}
          color="#38bdf8"
          gradientId="spark-pm25-grad"
          label="PM2.5"
          unit="µg/m³"
          currentVal={currentPM25}
        />
        <DiurnalSparkline
          data={pm10Diurnal}
          color="#34d399"
          gradientId="spark-pm10-grad"
          label="PM10"
          unit="µg/m³"
          currentVal={currentPM10}
        />
      </div>

      {/* Collapsible Raw Telemetry & Parser Inspector */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
        <button
          type="button"
          onClick={() => setIsInspectorOpen((prev) => !prev)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-850/60 transition"
        >
          <span className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Raw Telemetry & Parser Inspector
            <span className="text-[10px] font-mono text-slate-500">
              ({rowCount} rows • Delimiter: &apos;{delimiter}&apos;)
            </span>
          </span>
          {isInspectorOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isInspectorOpen && (
          <div className="p-4 border-t border-slate-800 space-y-3 animate-in fade-in duration-200">
            {/* Quick Presets & Upload Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-semibold text-slate-400">
                Official CPCB / SPCB Benchmark Presets:
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.tsv,.txt,.json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg transition"
                >
                  <Upload className="w-3 h-3 text-cyan-400" />
                  Upload IoT Log
                </button>
              </div>
            </div>

            {/* Benchmark Preset Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INDIAN_DATASETS.slice(0, 2).map((ds) => (
                <button
                  key={ds.id}
                  type="button"
                  onClick={() => {
                    setRawData(ds.csvData);
                    if (ds.cityKey) onCityChange(ds.cityKey);
                  }}
                  className="p-2.5 text-left rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition space-y-1"
                >
                  <div className="text-xs font-bold text-white line-clamp-1">{ds.name}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{ds.description}</div>
                </button>
              ))}
            </div>

            {/* Editable Raw Data Textarea */}
            <div className="space-y-1">
              <label htmlFor="raw-telemetry-editor" className="text-[11px] font-mono text-slate-400">
                Tabular Telemetry Feed (CSV / TSV / SPCB Stream):
              </label>
              <textarea
                id="raw-telemetry-editor"
                rows={5}
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                className="w-full bg-slate-950 font-mono text-[11px] text-slate-200 p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 scrollbar-thin"
                placeholder="Station,Timestamp,PM2.5,PM10,NO2,SO2,CO,O3..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
