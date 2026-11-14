'use client';

import React from 'react';
import { AlertCircle, Flame, ShieldCheck, Activity, MapPin, Clock } from 'lucide-react';
import { CivicBrief } from '@/types';

interface KpiMetricsProps {
  brief: CivicBrief;
  onRowClick?: (rowIndex: number) => void;
}

const KpiMetricsComponent: React.FC<KpiMetricsProps> = ({ brief, onRowClick }) => {
  const sum = brief.summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Overall Average AQI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider">Average Ambient AQI</span>
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-3 my-1">
          <span className="text-4xl font-extrabold text-white tracking-tight">{sum.averageAQI}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${sum.badgeColor}`}>
            {sum.category}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
          Standardized across {sum.totalStations} monitoring locations
        </p>
      </div>

      {/* 2. Peak Hotspot */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider">Critical Peak Hotspot</span>
          <Flame className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-1.5 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{sum.peakLocation}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-rose-400">AQI {sum.peakAQI}</span>
            {sum.peakRowIndex && (
              <button
                onClick={() => onRowClick && onRowClick(sum.peakRowIndex!)}
                className="text-[10px] text-cyan-400 hover:underline font-mono"
              >
                (Row #{sum.peakRowIndex})
              </button>
            )}
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="truncate">Peak at: {sum.peakTimestamp}</span>
        </div>
      </div>

      {/* 3. Dominant Pollutant */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider">Primary Driver</span>
          <AlertCircle className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <span className="text-3xl font-extrabold text-white tracking-tight">{sum.dominantPollutant}</span>
          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
            {sum.dominantPollutant.includes('PM2.5')
              ? 'Fine respirable combustion particles penetrating deep alveolar tissue'
              : sum.dominantPollutant.includes('PM10')
              ? 'Coarse dust & mechanical abrasion particles from construction/roads'
              : 'Gaseous combustion precursor'}
          </p>
        </div>
        <div className="text-[11px] text-amber-400/90 font-medium mt-2">
          {sum.hotspotCount} zones exceed safety standards
        </div>
      </div>

      {/* 4. Data Reliability & Gaps */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider">Data Reliability Score</span>
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">{brief.completenessPercent}%</span>
            <span className="text-xs text-slate-400">completeness</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                brief.completenessPercent > 90
                  ? 'bg-emerald-400'
                  : brief.completenessPercent > 70
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${brief.completenessPercent}%` }}
            />
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
          <span className="text-amber-400">{brief.anomalies.length} sensor flags</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400">{brief.dataGaps.length} telemetry gaps</span>
        </div>
      </div>
    </div>
  );
};

export const KpiMetrics = React.memo(KpiMetricsComponent);
