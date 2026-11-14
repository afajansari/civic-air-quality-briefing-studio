'use client';

import React from 'react';
import { Wind, Key, FileText } from 'lucide-react';

interface HeaderProps {
  onOpenApiKeyModal: () => void;
  hasCustomKey: boolean;
  onOpenHistoryModal: () => void;
  savedBriefCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenApiKeyModal,
  hasCustomKey,
  onOpenHistoryModal,
  savedBriefCount
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20" aria-hidden="true">
            <Wind className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Civic Air Quality Briefing Studio
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Civic AI 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              AI-driven intelligence for municipal authorities, housing societies & schools
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <nav aria-label="Quick Actions" className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenHistoryModal}
            aria-label={`View Briefs History (${savedBriefCount} saved briefs)`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span className="hidden sm:inline">Briefs History</span>
            {savedBriefCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                {savedBriefCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenApiKeyModal}
            aria-label={hasCustomKey ? 'Google Gemini API key active. Click to reconfigure.' : 'Configure Google Gemini API key'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
              hasCustomKey
                ? 'bg-purple-950/60 border-purple-600/60 text-purple-200 hover:bg-purple-900/60'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>{hasCustomKey ? 'Gemini AI Active' : 'Configure Gemini'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </header>
  );
};
