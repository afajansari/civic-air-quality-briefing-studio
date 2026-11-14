'use client';

import React, { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BriefComparison } from '@/types';

interface BriefComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: BriefComparison | null;
}

export const BriefComparisonModal: React.FC<BriefComparisonModalProps> = ({
  isOpen,
  onClose,
  comparison
}) => {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !comparison) return null;

  const aqiDelta = comparison.aqiDelta ?? 0;
  const isWorsening = comparison.aqiTrend === 'worsening';
  const isImproving = comparison.aqiTrend === 'improving';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isWorsening
                  ? 'bg-rose-500/20 text-rose-400'
                  : isImproving
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800 text-slate-300'
              }`}
              aria-hidden="true"
            >
              {isWorsening ? <TrendingUp className="w-5 h-5" /> : isImproving ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="comparison-modal-title" className="text-base font-bold text-white">
                Previous Brief Comparison (Delta Engine)
              </h2>
              <p className="text-xs text-slate-400">Tracking what changed since the previous monitoring cycle</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close brief comparison dialog"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {!comparison.hasPrevious ? (
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
              <div className="text-sm font-semibold text-white">Baseline Record Established</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {comparison.message || 'This is the first brief generated. Every subsequent brief you run will automatically be compared against this one to calculate progress, shifts, and intervention impact.'}
              </p>
            </div>
          ) : (
            <>
              {/* Executive Change Narrative */}
              <div
                role="region"
                aria-label="Change Narrative Summary"
                className={`p-4 rounded-2xl border ${
                  isWorsening
                    ? 'bg-rose-950/20 border-rose-900/50 text-rose-200'
                    : isImproving
                    ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-200'
                } text-xs sm:text-sm leading-relaxed font-medium`}
              >
                {comparison.changeSummaryText}
              </div>

              {/* High-Level Comparison Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Average AQI Delta</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-black ${isWorsening ? 'text-rose-400' : isImproving ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {aqiDelta > 0 ? `+${aqiDelta}` : aqiDelta} pts
                    </span>
                    <span className="text-xs text-slate-400 capitalize">({comparison.aqiTrend})</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Prev: {comparison.previousAverageAQI} → Curr: {comparison.currentAverageAQI}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Hotspot Movement</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {comparison.hotspots?.currentCount} Hotspots
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {comparison.hotspots?.newlyEmerged?.length || 0} newly emerged | {comparison.hotspots?.resolved?.length || 0} resolved
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Telemetry Health</div>
                  <div className="text-2xl font-black text-cyan-400 mt-1">
                    {(comparison.reliability?.completenessDelta ?? 0) >= 0 ? `+${comparison.reliability?.completenessDelta}%` : `${comparison.reliability?.completenessDelta}%`}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {comparison.reliability?.gapDelta ?? 0} change in telemetry gaps
                  </div>
                </div>
              </div>

              {/* Station Diff Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Station-by-Station Progression
                </h3>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs" aria-label="Station by station air quality delta table">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th scope="col" className="py-2 px-3">Station</th>
                        <th scope="col" className="py-2 px-3">Prev AQI</th>
                        <th scope="col" className="py-2 px-3">Curr AQI</th>
                        <th scope="col" className="py-2 px-3">Net Delta</th>
                        <th scope="col" className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {(comparison.stationDeltas || []).map((st, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-sans font-medium text-white">{st.station}</td>
                          <td className="py-2 px-3 text-slate-400">{st.previousAQI ?? '—'}</td>
                          <td className="py-2 px-3 font-bold text-white">{st.currentAQI}</td>
                          <td className="py-2 px-3 font-bold">
                            {st.aqiDelta !== null ? (
                              <span className={st.aqiDelta > 0 ? 'text-rose-400' : st.aqiDelta < 0 ? 'text-emerald-400' : 'text-slate-400'}>
                                {st.aqiDelta > 0 ? `+${st.aqiDelta}` : st.aqiDelta}
                              </span>
                            ) : (
                              'New'
                            )}
                          </td>
                          <td className="py-2 px-3 font-sans capitalize text-[11px] text-slate-300">
                            {st.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
