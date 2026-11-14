'use client';

import React, { useState } from 'react';
import { Table, Search, AlertTriangle, Filter, CheckCircle2 } from 'lucide-react';
import { AirQualityRecord, CivicBrief } from '@/types';

interface TraceabilityTableProps {
  brief: CivicBrief;
  highlightRowIndex?: number | null;
}

export const TraceabilityTable: React.FC<TraceabilityTableProps> = ({
  brief,
  highlightRowIndex
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterIssueOnly, setFilterIssueOnly] = useState<boolean>(false);

  // Flatten all station records
  const allRecords: AirQualityRecord[] = [];
  (brief.stations || []).forEach(st => {
    (st.records || []).forEach(r => allRecords.push(r));
  });

  // Sort by row index
  allRecords.sort((a, b) => a.rowIndex - b.rowIndex);

  const filteredRecords = allRecords.filter(r => {
    const matchesSearch =
      r.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.rowIndex).includes(searchTerm);

    const matchesIssue = filterIssueOnly ? r.issues.length > 0 : true;
    return matchesSearch && matchesIssue;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            Verified Underlying Telemetry & Traceability Audit Table
          </h3>
          <p className="text-xs text-slate-400">
            Every AI finding is grounded in the exact row numbers and sensor timestamps below
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by station or row..."
              className="bg-slate-950 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>

          {/* Anomaly filter toggle */}
          <button
            onClick={() => setFilterIssueOnly(!filterIssueOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              filterIssueOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Only Issues ({brief.anomalies.length})</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold z-10">
            <tr>
              <th className="py-2 px-3">Row #</th>
              <th className="py-2 px-3">Monitoring Station</th>
              <th className="py-2 px-3">Timestamp</th>
              <th className="py-2 px-3">AQI</th>
              <th className="py-2 px-3">Category</th>
              <th className="py-2 px-3">PM2.5 (µg/m³)</th>
              <th className="py-2 px-3">PM10 (µg/m³)</th>
              <th className="py-2 px-3">NO2</th>
              <th className="py-2 px-3">Audit Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredRecords.map((r) => {
              const isHighlighted = highlightRowIndex === r.rowIndex;
              const hasAnomaly = r.issues.length > 0;

              return (
                <tr
                  key={r.rowIndex}
                  id={`trace-row-${r.rowIndex}`}
                  className={`transition ${
                    isHighlighted
                      ? 'bg-cyan-950/80 border-l-4 border-cyan-400 font-bold'
                      : hasAnomaly
                      ? 'bg-amber-950/20 hover:bg-amber-950/30'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2 px-3 text-cyan-400 font-bold">#{r.rowIndex}</td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-200">{r.station}</td>
                  <td className="py-2 px-3 text-slate-400 text-[11px] font-sans">{r.timestamp}</td>
                  <td className="py-2 px-3 font-bold text-white">{r.aqi}</td>
                  <td className="py-2 px-3 font-sans">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${r.badgeColor}`}>
                      {r.category}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-200">{r.pollutants.pm25 ?? '—'}</td>
                  <td className="py-2 px-3 text-slate-200">{r.pollutants.pm10 ?? '—'}</td>
                  <td className="py-2 px-3 text-slate-200">{r.pollutants.no2 ?? '—'}</td>
                  <td className="py-2 px-3 font-sans">
                    {r.issues.length > 0 ? (
                      <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" />
                        {r.issues[0].message}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <span>Showing {filteredRecords.length} of {allRecords.length} recorded observations</span>
        <span className="text-cyan-400 font-mono text-[11px]">100% Traceable Grounded Data</span>
      </div>
    </div>
  );
};
