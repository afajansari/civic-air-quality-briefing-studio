'use client';

import React from 'react';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { CivicBrief } from '@/types';

interface DataIntegrityPanelProps {
  brief: CivicBrief;
  onSelectAnomaly?: (rowIndex: number) => void;
}

const DataIntegrityPanelComponent: React.FC<DataIntegrityPanelProps> = ({ brief, onSelectAnomaly }) => {
  const anomalies = brief.anomalies || [];
  const gaps = brief.dataGaps || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Data Integrity, Gaps & Anomaly Audit</h3>
            <p className="text-xs text-slate-400">
              Transparently flags sensor freeze, baseline drift, and telemetry dropouts to prevent false alarms
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
            {brief.completenessPercent}% Data Completeness
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sensor Anomalies List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Flagged Sensor Anomalies ({anomalies.length})
            </span>
          </div>

          {anomalies.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              No hardware freezes, extreme outliers, or negative drift detected.
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {anomalies.map((an, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectAnomaly && onSelectAnomaly(an.rowIndex)}
                  className="p-2.5 rounded-xl border border-amber-900/40 bg-amber-950/20 hover:bg-amber-950/40 cursor-pointer transition text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <span>{an.type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Row #{an.rowIndex}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{an.detail}</p>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Station: {an.station} | {an.timestamp}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400/60 shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Telemetry Data Gaps List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Temporal Telemetry Gaps ({gaps.length})
            </span>
          </div>

          {gaps.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Continuous uninterrupted transmission across all stations.
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-cyan-900/40 bg-cyan-950/20 text-xs flex items-start gap-2"
                >
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-cyan-300 flex items-center gap-2">
                      <span>{gap.station}</span>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-medium">
                        {gap.gapHours} Hours Missing
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">{gap.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const DataIntegrityPanel = React.memo(DataIntegrityPanelComponent);
