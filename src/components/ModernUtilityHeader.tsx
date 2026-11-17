'use client';

import React from 'react';
import {
  Wind,
  Search,
  RefreshCw,
  History,
  Key,
  MapPin
} from 'lucide-react';

interface ModernUtilityHeaderProps {
  currentStation: string;
  coordinates?: { lat: number; lon: number } | null;
  onOpenCommandPalette: () => void;
  onRefreshLive: () => void;
  isRefreshingLive: boolean;
  onOpenHistory: () => void;
  savedBriefCount: number;
  onOpenApiKey: () => void;
  hasCustomKey: boolean;
  className?: string;
}

export const ModernUtilityHeader: React.FC<ModernUtilityHeaderProps> = ({
  currentStation,
  coordinates,
  onOpenCommandPalette,
  onRefreshLive,
  isRefreshingLive,
  onOpenHistory,
  savedBriefCount,
  onOpenApiKey,
  hasCustomKey,
  className = ''
}) => {
  return (
    <header
      role="banner"
      className={`border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Left Section: Brand & Telemetry Status Pill */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/10"
              aria-hidden="true"
            >
              <Wind className="w-5 h-5 text-slate-950" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                CIVIC AQ STUDIO
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  HUD
                </span>
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden md:block shrink-0" aria-hidden="true" />

          {/* Live Telemetry Status Pill */}
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 shadow-sm shrink-0"
            title="Active Indian Continuous Ambient Air Quality Monitoring (CAAQMS) Telemetry"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider">
              LIVE • 15m ISR • CPCB/Open-Meteo
            </span>
          </div>

          {/* Active Station Pill with Coordinates */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900/90 text-slate-200 border border-slate-800 truncate"
            title={`Active Station: ${currentStation}`}
          >
            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" aria-hidden="true" />
            <span className="font-bold text-white truncate max-w-[150px]">
              {currentStation || 'Delhi CAAQMS'}
            </span>
            {coordinates && (
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                ({coordinates.lat.toFixed(2)}°N, {coordinates.lon.toFixed(2)}°E)
              </span>
            )}
          </div>
        </div>

        {/* Right Section: Command Palette Trigger & Utility Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Button to Open Command Palette (Cmd+K) */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            aria-label="Open Command Palette (Press Ctrl+K or Cmd+K)"
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm text-xs"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span className="hidden sm:inline font-medium">Commands</span>
            <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-800 border border-slate-700 rounded text-slate-300">
              ⌘K
            </kbd>
          </button>

          {/* Refresh Telemetry Button with Loading Spinner */}
          <button
            type="button"
            onClick={onRefreshLive}
            disabled={isRefreshingLive}
            aria-label={`Refresh live air quality telemetry for ${currentStation}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-emerald-300 hover:text-emerald-200 border border-slate-800 hover:border-slate-700 disabled:opacity-50 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-emerald-400 ${
                isRefreshingLive ? 'animate-spin' : ''
              }`}
              aria-hidden="true"
            />
            <span className="hidden md:inline">
              {isRefreshingLive ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            aria-label="View history and saved brief archives"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-medium"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span className="hidden md:inline">History</span>
            {savedBriefCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {savedBriefCount}
              </span>
            )}
          </button>

          {/* API Key Button */}
          <button
            type="button"
            onClick={onOpenApiKey}
            aria-label="Configure API Key for AI synthesis"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-medium"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span className="hidden md:inline">
              {hasCustomKey ? 'Custom Key' : 'API Key'}
            </span>
            {hasCustomKey && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                title="Custom API key configured"
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
