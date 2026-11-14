'use client';

import React from 'react';
import { FileText, Printer, MapPin, Download } from 'lucide-react';
import { CivicBrief } from '@/types';

interface BriefingNoteTabProps {
  brief: CivicBrief;
  onPrint: () => void;
  onExportMarkdown: () => void;
}

export const BriefingNoteTab: React.FC<BriefingNoteTabProps> = ({
  brief,
  onPrint,
  onExportMarkdown
}) => {
  const note = brief.internalBriefingNote;

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Internal Administrative Briefing Note
          </h2>
          <p className="text-xs text-slate-400">
            Confidential technical memo for {brief.personaTitle} & municipal action teams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export MD
          </button>
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-slate-950 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            Print Official Memo
          </button>
        </div>
      </div>

      {/* Styled Formal Document Memo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Memo Header */}
        <div className="border-b-2 border-slate-700 pb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 print:text-blue-700">
              Civic Air Quality Briefing Studio • Intelligence Operations
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight print:text-black">
              CIVIC AIR QUALITY BRIEFING NOTE
            </h1>
            <div className="text-xs text-slate-400 mt-1 font-mono print:text-gray-600">
              REF: {note.docRef} | ISSUED: {note.date}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-extrabold px-3 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider">
              {note.classification}
            </span>
            <div className="text-xs text-slate-300 font-medium mt-1.5">
              Audience: {note.targetAudience}
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            1. Executive Plain-Language Summary
          </h3>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed print:bg-gray-50 print:text-black print:border-gray-200">
            {note.executiveSummary}
          </div>
        </div>

        {/* Hotspot & Likely Cause Diagnosis */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            2. Likely Hotspot Causes & Environmental Diagnosis
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/50">
                  <th className="py-2.5 px-3">Location / Station</th>
                  <th className="py-2.5 px-3">Peak AQI</th>
                  <th className="py-2.5 px-3">Peak Time</th>
                  <th className="py-2.5 px-3">Likely Hotspot Driver</th>
                  <th className="py-2.5 px-3">Grounded Data Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {note.hotspotAnalysis.map((hs, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      {hs.station}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-rose-400">{hs.peakAQI}</span> ({hs.severity})
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{hs.peakTime}</td>
                    <td className="py-2.5 px-3 text-slate-300">{hs.likelyCauses}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-400">
                      Row #{hs.peakRow || 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prioritized Action Recommendations */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            3. Prioritized Local Interventions (Tailored for {brief.personaTitle})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {note.prioritizedActions.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        act.priority === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : act.priority === 'High'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                      }`}
                    >
                      {act.priority} Priority
                    </span>
                    <span className="text-xs font-bold text-white">{act.action}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Responsible: <strong className="text-slate-300">{act.responsible}</strong></span>
                    <span>Timeframe: <strong className="text-slate-300">{act.timeframe}</strong></span>
                    <span>Expected Impact: <strong className="text-emerald-400">{act.impact}</strong></span>
                  </div>
                  <div className="text-[10px] text-cyan-400/80 font-mono">
                    Grounding: {act.groundedIn}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Directives */}
        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            4. Regulatory Directives & Action Audit Protocol
          </h3>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
            {note.complianceDirectives.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
