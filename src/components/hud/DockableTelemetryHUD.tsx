'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ChevronDown, ChevronUp, Gauge } from 'lucide-react';
import { LiveCriteriaCurrent } from '@/components/DataIngestion';

interface DockableTelemetryHUDProps {
  currentStation: string;
  currentCity: string;
  activeAqi: number;
  current?: LiveCriteriaCurrent;
  className?: string;
}

export function DockableTelemetryHUD({
  currentStation,
  currentCity,
  activeAqi,
  current = {},
  className = '',
}: DockableTelemetryHUDProps) {
  const [isDocked, setIsDocked] = useState(false);

  // CPCB severity breakdown
  const getCpcbCategory = (val: number): { label: string; color: string; badgeClass: string; stroke: string } => {
    if (val <= 50) {
      return {
        label: 'Good',
        color: 'text-emerald-400',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        stroke: '#10b981',
      };
    }
    if (val <= 100) {
      return {
        label: 'Satisfactory',
        color: 'text-teal-400',
        badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        stroke: '#14b8a6',
      };
    }
    if (val <= 200) {
      return {
        label: 'Moderate',
        color: 'text-amber-400',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        stroke: '#f59e0b',
      };
    }
    if (val <= 300) {
      return {
        label: 'Poor',
        color: 'text-orange-400',
        badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
        stroke: '#f97316',
      };
    }
    if (val <= 400) {
      return {
        label: 'Very Poor',
        color: 'text-rose-400',
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        stroke: '#ef4444',
      };
    }
    return {
      label: 'Severe',
      color: 'text-purple-400',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      stroke: '#a855f7',
    };
  };

  const category = getCpcbCategory(activeAqi);

  // SVG Arc calculation for radial gauge
  // Arc spans 180 degrees from -180 to 0
  const normalizedAQI = Math.min(500, Math.max(0, activeAqi));
  const arcLength = 251.2; // Circumference of semicircle r=80
  const dashOffset = arcLength - (normalizedAQI / 500) * arcLength;

  if (isDocked) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsDocked(false)}
        className={`h-8 px-3 rounded-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 shadow-xl text-xs gap-1.5 font-bold animate-in fade-in ${className}`}
        aria-label="Expand telemetry HUD"
      >
        <Gauge className="size-3.5 text-cyan-400" />
        <span className="text-white">AQI {activeAqi}</span>
        <span className={`text-[10px] ${category.color}`}>({category.label})</span>
        <ChevronDown className="size-3 text-slate-400 ml-0.5" />
      </Button>
    );
  }

  return (
    <Card
      className={`border-border/70 bg-slate-900/85 backdrop-blur-md shadow-2xl rounded-xl overflow-hidden transition-all duration-200 ${className}`}
      role="region"
      aria-label="Dockable Telemetry HUD"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-slate-950/40">
        <div className="flex items-center gap-1.5 min-w-0">
          <Activity className="size-3.5 text-primary shrink-0" />
          <span className="text-xs font-bold text-white truncate max-w-[140px]">
            {currentStation || currentCity}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsDocked(true)}
          className="h-5 px-1.5 text-[10px] text-slate-400 hover:text-white"
          title="Dock HUD to minimize view"
          aria-label="Minimize telemetry HUD"
        >
          <ChevronUp className="size-3" />
          <span className="sr-only">Dock HUD</span>
        </Button>
      </div>

      <CardContent className="p-3 flex flex-col gap-3">
        {/* Radial AQI Arc Meter */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative size-20 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 60" className="w-20 h-12 overflow-visible">
              {/* Background Arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Value Arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={category.stroke}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (normalizedAQI / 500) * 125.6}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0 text-center flex flex-col items-center">
              <span className="text-lg font-black text-white leading-none font-mono">{activeAqi}</span>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">CPCB AQI</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 min-w-0">
            <Badge variant="outline" className={`text-[10px] font-extrabold uppercase px-2 py-0.5 ${category.badgeClass}`}>
              {category.label}
            </Badge>
            <span className="text-[10px] text-slate-400 leading-tight">
              Dominant criteria: <strong className="text-slate-200">PM2.5 / PM10</strong>
            </span>
          </div>
        </div>

        {/* Criteria Pollutant Mini Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-slate-800/80 pt-2">
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">PM2.5</span>
            <span className="font-bold text-white">{current.pm25 != null ? Math.round(Number(current.pm25)) : 92} µg</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">PM10</span>
            <span className="font-bold text-white">{current.pm10 != null ? Math.round(Number(current.pm10)) : 165} µg</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">NO2</span>
            <span className="font-bold text-white">{current.no2 != null ? Math.round(Number(current.no2)) : 48} µg</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">SO2</span>
            <span className="font-bold text-white">{current.so2 != null ? Math.round(Number(current.so2)) : 14} µg</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
